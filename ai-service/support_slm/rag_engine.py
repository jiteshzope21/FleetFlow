import os
import glob
import json
import torch
from typing import List, Dict, Any, Optional
from transformers import AutoTokenizer, AutoModel

EMBEDDING_MODEL_ID = "sentence-transformers/all-MiniLM-L6-v2"
BASE_DIR = os.path.dirname(__file__)
KB_DIR = os.path.join(BASE_DIR, "knowledge_base")
INDEX_PATH = os.path.join(BASE_DIR, "knowledge_index.json")
EMBEDDINGS_PATH = os.path.join(BASE_DIR, "knowledge_embeddings.pt")

class RAGEngine:
    def __init__(self, device: Optional[str] = None):
        if device is None:
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
        else:
            self.device = device
            
        self.tokenizer = None
        self.model = None
        self.documents: List[Dict[str, Any]] = []
        self.embeddings: Optional[torch.Tensor] = None
        self._load_embedder()
        self.load_or_build_index()

    def _load_embedder(self):
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(EMBEDDING_MODEL_ID, local_files_only=True)
            self.model = AutoModel.from_pretrained(EMBEDDING_MODEL_ID, local_files_only=True).to(self.device)
            self.model.eval()
        except Exception as e:
            print(f"[RAGEngine] Note: Fallback tokenizer/model loading ({e})")
            self.tokenizer = AutoTokenizer.from_pretrained(EMBEDDING_MODEL_ID)
            self.model = AutoModel.from_pretrained(EMBEDDING_MODEL_ID).to(self.device)
            self.model.eval()

    def _mean_pooling(self, model_output, attention_mask):
        token_embeddings = model_output[0]
        input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
        sum_embeddings = torch.sum(token_embeddings * input_mask_expanded, 1)
        sum_mask = torch.clamp(input_mask_expanded.sum(1), min=1e-9)
        return sum_embeddings / sum_mask

    def encode_texts(self, texts: List[str]) -> torch.Tensor:
        encoded_input = self.tokenizer(
            texts,
            padding=True,
            truncation=True,
            max_length=512,
            return_tensors="pt"
        ).to(self.device)

        with torch.no_grad():
            model_output = self.model(**encoded_input)
            sentence_embeddings = self._mean_pooling(model_output, encoded_input['attention_mask'])
            sentence_embeddings = torch.nn.functional.normalize(sentence_embeddings, p=2, dim=1)
        return sentence_embeddings.cpu()

    def build_index(self):
        print("[RAGEngine] Ingesting FleetFlow knowledge base documents...")
        md_files = glob.glob(os.path.join(KB_DIR, "*.md"))
        chunks = []

        for fpath in sorted(md_files):
            fname = os.path.basename(fpath)
            topic = fname.replace(".md", "").split("_", 1)[-1].replace("_", " ").title()
            with open(fpath, "r", encoding="utf-8") as f:
                content = f.read()

            # Split into sections by Markdown headers (##)
            sections = content.split("\n## ")
            doc_title = sections[0].replace("# ", "").strip()

            for i, sec in enumerate(sections):
                if i == 0 and not sec.startswith("#"):
                    continue
                header = doc_title if i == 0 else sec.split("\n", 1)[0].strip()
                body = sec if i == 0 else (sec.split("\n", 1)[1].strip() if "\n" in sec else "")
                if not body:
                    continue

                chunk_text = f"Module: {topic} | Topic: {header}\n{body}"
                chunks.append({
                    "id": f"{fname}#{i}",
                    "source": fname,
                    "topic": topic,
                    "header": header,
                    "text": chunk_text,
                    "length": len(chunk_text)
                })

        print(f"[RAGEngine] Extracted {len(chunks)} knowledge chunks across {len(md_files)} documents.")
        self.documents = chunks

        # Compute embeddings in batches
        texts = [c["text"] for c in chunks]
        batch_size = 16
        all_embeddings = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            emb = self.encode_texts(batch)
            all_embeddings.append(emb)

        self.embeddings = torch.cat(all_embeddings, dim=0)

        # Save index and embeddings
        with open(INDEX_PATH, "w", encoding="utf-8") as f:
            json.dump(self.documents, f, indent=2)
        torch.save(self.embeddings, EMBEDDINGS_PATH)
        print(f"[RAGEngine] Successfully built and saved index ({len(chunks)} chunks, shape: {self.embeddings.shape}).")

    def load_or_build_index(self):
        if os.path.exists(INDEX_PATH) and os.path.exists(EMBEDDINGS_PATH):
            try:
                with open(INDEX_PATH, "r", encoding="utf-8") as f:
                    self.documents = json.load(f)
                self.embeddings = torch.load(EMBEDDINGS_PATH, map_location="cpu")
                print(f"[RAGEngine] Loaded existing index: {len(self.documents)} chunks.")
                return
            except Exception as e:
                print(f"[RAGEngine] Error loading existing index: {e}, rebuilding...")

        self.build_index()

    def search(self, query: str, top_k: int = 3, threshold: float = 0.35) -> List[Dict[str, Any]]:
        if not self.documents or self.embeddings is None:
            return []

        query_emb = self.encode_texts([query]) # [1, 384]
        # Compute cosine similarity
        similarities = torch.mm(query_emb, self.embeddings.T).squeeze(0) # [N]
        top_scores, top_indices = torch.topk(similarities, min(top_k, len(self.documents)))

        results = []
        for score, idx in zip(top_scores.tolist(), top_indices.tolist()):
            if score >= threshold:
                doc = dict(self.documents[idx])
                doc["score"] = round(float(score), 4)
                results.append(doc)

        return results

    def get_grounded_context(self, query: str, top_k: int = 3) -> str:
        results = self.search(query, top_k=top_k)
        if not results:
            return ""
        context_parts = []
        for idx, doc in enumerate(results, 1):
            context_parts.append(f"--- DOCUMENT {idx} [{doc['source']} | {doc['header']}] ---\n{doc['text']}")
        return "\n\n".join(context_parts)

if __name__ == "__main__":
    engine = RAGEngine()
    test_queries = [
        "How do I assign a driver to a vehicle?",
        "Why is my vehicle blocked from trip dispatch?",
        "What are the subscription plans and limits?",
        "How does the AI trip cost predictor calculate fuel?",
        "Can I see another company's data?"
    ]
    for q in test_queries:
        res = engine.search(q, top_k=2)
        print(f"\nQuery: '{q}' -> Found {len(res)} results:")
        for r in res:
            print(f"  - [{r['score']}] {r['source']} > {r['header']}")

