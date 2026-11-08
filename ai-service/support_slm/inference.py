"""
FleetFlow Domain-Specific SLM Inference Engine
Integrates Qwen2.5-1.5B Base / LoRA Fine-Tuned Checkpoint with RAG Knowledge Retrieval.
"""

import os
import sys
import json
import time
import torch
import torch.nn as nn
from typing import List, Dict, Any, Optional, Tuple
from transformers import AutoModelForCausalLM, AutoTokenizer

from rag_engine import RAGEngine

BASE_DIR = os.path.dirname(__file__)
MODEL_DIR = os.path.join(BASE_DIR, "models", "fleetflow_qwen_lora")
ADAPTER_PATH = os.path.join(MODEL_DIR, "adapter_model.pt")
CONFIG_PATH = os.path.join(MODEL_DIR, "adapter_config.json")
BASE_MODEL_ID = "Qwen/Qwen2.5-1.5B-Instruct"

SYSTEM_INSTRUCTION = (
    "You are the FleetFlow AI Customer Support Assistant, an expert, professional, and courteous AI assistant "
    "for FleetFlow — an enterprise multi-tenant fleet management and transport logistics SaaS platform.\n"
    "Your objective is to provide precise, step-by-step instructions grounded strictly in verified FleetFlow features.\n"
    "Rules:\n"
    "1. Never fabricate application features, buttons, or APIs that do not exist.\n"
    "2. Respect user roles and tenant isolation: never reveal or query another company's records.\n"
    "3. Never disclose passwords, secret keys, or internal system credentials.\n"
    "4. If a question is outside FleetFlow or cannot be resolved, offer to escalate to human support."
)

class LoRALinear(nn.Module):
    def __init__(self, original_linear: nn.Linear, r: int = 16, lora_alpha: int = 32):
        super().__init__()
        self.original_linear = original_linear
        self.in_features = original_linear.in_features
        self.out_features = original_linear.out_features
        self.r = r
        self.lora_alpha = lora_alpha
        self.scaling = lora_alpha / r

        self.lora_A = nn.Parameter(torch.empty(r, self.in_features, dtype=original_linear.weight.dtype, device=original_linear.weight.device))
        self.lora_B = nn.Parameter(torch.zeros(self.out_features, r, dtype=original_linear.weight.dtype, device=original_linear.weight.device))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        orig = self.original_linear(x)
        delta = (x @ self.lora_A.transpose(0, 1)) @ self.lora_B.transpose(0, 1)
        return orig + delta * self.scaling

class FleetFlowSLM:
    def __init__(self, device: Optional[str] = None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.tokenizer = None
        self.model = None
        self.has_lora = False
        self.rag_engine = None
        self.model_status = "INITIALIZING"
        self._initialize()

    def _initialize(self):
        print(f"[FleetFlowSLM] Initializing SLM on device: {self.device.upper()}...")
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_ID, local_files_only=True)
            self.model = AutoModelForCausalLM.from_pretrained(
                BASE_MODEL_ID,
                dtype=torch.bfloat16 if self.device == "cuda" else torch.float32,
                local_files_only=True
            ).to(self.device)
            self.model.eval()
            print("[FleetFlowSLM] Base model Qwen2.5-1.5B-Instruct loaded successfully.")
        except Exception as e:
            print(f"[FleetFlowSLM] Warning: Base model could not be loaded: {e}")
            self.model = None
            self.model_status = "BASE_MODEL_MISSING"
            # Continue without model; we'll rely on RAG only.
        
        # Check for fine-tuned LoRA checkpoint
        if os.path.exists(ADAPTER_PATH) and os.path.exists(CONFIG_PATH) and self.model is not None:
            try:
                print(f"[FleetFlowSLM] Loading fine-tuned LoRA adapter from {ADAPTER_PATH}...")
                with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                    config = json.load(f)
                r = config.get("r", 16)
                alpha = config.get("lora_alpha", 32)

                # Attach LoRA modules
                for name, module in self.model.named_modules():
                    if hasattr(module, "q_proj") and isinstance(module.q_proj, nn.Linear):
                        module.q_proj = LoRALinear(module.q_proj, r=r, lora_alpha=alpha)
                    if hasattr(module, "v_proj") and isinstance(module.v_proj, nn.Linear):
                        module.v_proj = LoRALinear(module.v_proj, r=r, lora_alpha=alpha)

                # Load weights
                lora_weights = torch.load(ADAPTER_PATH, map_location=self.device)
                missing, unexpected = self.model.load_state_dict(lora_weights, strict=False)
                self.has_lora = True
                print(f"[FleetFlowSLM] Successfully loaded LoRA adapter weights ({len(lora_weights)} tensors).")
            except Exception as e:
                print(f"[FleetFlowSLM] Warning: Failed to load LoRA adapter ({e}). Continuing with base model.")
        else:
            if self.model is None:
                print("[FleetFlowSLM] Skipping LoRA loading because base model is unavailable.")
            else:
                print("[FleetFlowSLM] No LoRA adapter found; using base model.")

        # Initialize RAG Engine
        try:
            self.rag_engine = RAGEngine(device=self.device)
            print("[FleetFlowSLM] RAG Engine loaded successfully.")
        except Exception as e:
            print(f"[FleetFlowSLM] Warning: RAG Engine initialization error: {e}")
            self.rag_engine = None

        # Determine overall status
        if self.model is not None and self.has_lora and self.rag_engine:
            self.model_status = "FINE_TUNED_SLM_WITH_RAG"
        elif self.model is not None and self.rag_engine:
            self.model_status = "BASE_MODEL_WITH_RAG"
        elif self.rag_engine:
            self.model_status = "RAG_ONLY"
        else:
            self.model_status = "UNAVAILABLE"

        print(f"[FleetFlowSLM] Active Engine Mode: {self.model_status}")

        # Check for fine-tuned LoRA checkpoint
        if os.path.exists(ADAPTER_PATH) and os.path.exists(CONFIG_PATH):
            try:
                print(f"[FleetFlowSLM] Loading fine-tuned LoRA adapter from {ADAPTER_PATH}...")
                with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                    config = json.load(f)
                r = config.get("r", 16)
                alpha = config.get("lora_alpha", 32)

                # Attach LoRA modules
                for name, module in self.model.named_modules():
                    if hasattr(module, "q_proj") and isinstance(module.q_proj, nn.Linear):
                        module.q_proj = LoRALinear(module.q_proj, r=r, lora_alpha=alpha)
                    if hasattr(module, "v_proj") and isinstance(module.v_proj, nn.Linear):
                        module.v_proj = LoRALinear(module.v_proj, r=r, lora_alpha=alpha)

                # Load weights
                lora_weights = torch.load(ADAPTER_PATH, map_location=self.device)
                missing, unexpected = self.model.load_state_dict(lora_weights, strict=False)
                self.has_lora = True
                print(f"[FleetFlowSLM] Successfully loaded LoRA adapter weights ({len(lora_weights)} tensors).")
            except Exception as e:
                print(f"[FleetFlowSLM] Warning: Failed to load LoRA adapter ({e}). Continuing with base model.")

        # Initialize RAG Engine
        try:
            self.rag_engine = RAGEngine(device=self.device)
            print("[FleetFlowSLM] RAG Engine loaded successfully.")
        except Exception as e:
            print(f"[FleetFlowSLM] Warning: RAG Engine initialization error: {e}")

        if self.has_lora and self.rag_engine:
            self.model_status = "FINE_TUNED_SLM_WITH_RAG"
        elif self.has_lora:
            self.model_status = "FINE_TUNED_SLM"
        else:
            self.model_status = "BASE_MODEL_WITH_RAG" if self.rag_engine else "BASE_MODEL"

        print(f"[FleetFlowSLM] Active Engine Mode: {self.model_status}")

    def generate_response(
        self,
        query: str,
        history: List[Dict[str, str]] = None,
        user_role: str = "DISPATCHER",
        company_name: str = "FleetFlow Workspace",
        top_k_rag: int = 2
    ) -> Dict[str, Any]:
        t0 = time.time()
        history = history or []

        # 1. RAG Knowledge Retrieval
        rag_sources = []
        grounded_context = ""
        if self.rag_engine:
            retrieved_docs = self.rag_engine.search(query, top_k=top_k_rag)
            if retrieved_docs:
                rag_sources = [{"source": d["source"], "header": d["header"], "score": d["score"]} for d in retrieved_docs]
                grounded_context = self.rag_engine.get_grounded_context(query, top_k=top_k_rag)

        # 2. Build Prompt Messages
        system_text = (
            f"{SYSTEM_INSTRUCTION}\n\n"
            f"Active User Context:\n"
            f"- Authenticated Role: {user_role}\n"
            f"- Workspace: {company_name}\n"
        )
        if grounded_context:
            system_text += f"\nVerified FleetFlow Knowledge Context:\n{grounded_context}\n"

        prompt_messages = [{"role": "system", "content": system_text}]
        for h in history[-6:]: # Keep recent 3 turns
            prompt_messages.append({"role": h["role"], "content": h["content"]})
        prompt_messages.append({"role": "user", "content": query})

        # Apply chat template
        prompt_str = self.tokenizer.apply_chat_template(
            prompt_messages,
            tokenize=False,
            add_generation_prompt=True
        )
        inputs = self.tokenizer(prompt_str, return_tensors="pt").to(self.device)

        # 3. Model Generation
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=350,
                do_sample=False, # deterministic greedy decoding for factual support
                temperature=1.0,
                pad_token_id=self.tokenizer.eos_token_id
            )

        gen_tokens = outputs[0][inputs["input_ids"].shape[1]:]
        raw_response = self.tokenizer.decode(gen_tokens, skip_special_tokens=True).strip()

        latency_ms = round((time.time() - t0) * 1000, 1)

        # 4. Escalation & Follow-up Detection
        should_escalate = False
        escalation_category = "GENERAL"
        escalation_priority = "MEDIUM"

        lower_query = query.lower()
        lower_resp = raw_response.lower()

        if any(w in lower_query for w in ["escalat", "human support", "speak to human", "complaint", "fraud", "illegal", "card charged", "refund", "ticket"]):
            should_escalate = True
            if "refund" in lower_query or "charged" in lower_query or "bill" in lower_query:
                escalation_category = "BILLING"
                escalation_priority = "HIGH"
            elif "broken" in lower_query or "bug" in lower_query or "crash" in lower_query:
                escalation_category = "TECHNICAL"
                escalation_priority = "HIGH"

        # Suggested follow-up questions based on domain context
        suggested_followups = []
        if "vehicle" in lower_query or "truck" in lower_query:
            suggested_followups = [
                "How do I assign a driver to this vehicle?",
                "What documents are needed to register a truck?",
                "How do I view vehicle maintenance history?"
            ]
        elif "trip" in lower_query or "dispatch" in lower_query:
            suggested_followups = [
                "How do I submit Proof of Delivery (POD)?",
                "What if a vehicle is in maintenance?",
                "How do I calculate trip cost with AI?"
            ]
        elif "invoice" in lower_query or "payment" in lower_query or "bill" in lower_query:
            suggested_followups = [
                "How do I record a partial advance payment?",
                "How do I export invoices to CSV?",
                "What subscription plans are available?"
            ]
        else:
            suggested_followups = [
                "How do I schedule a trip?",
                "How do I add a new vehicle?",
                "Where can I view fuel economy analytics?"
            ]

        return {
            "query": query,
            "response": raw_response,
            "model_status": self.model_status,
            "has_lora": self.has_lora,
            "rag_sources": rag_sources,
            "latency_ms": latency_ms,
            "should_escalate": should_escalate,
            "escalation_metadata": {
                "category": escalation_category,
                "priority": escalation_priority,
                "suggested_subject": query[:80]
            } if should_escalate else None,
            "suggested_followups": suggested_followups[:3]
        }

if __name__ == "__main__":
    engine = FleetFlowSLM()
    res = engine.generate_response("How do I assign a driver to a vehicle?", user_role="DISPATCHER")
    print("\n--- INFERENCE RESULT ---")
    print(f"Status: {res['model_status']} (Latency: {res['latency_ms']} ms)")
    print(f"Sources: {[s['header'] for s in res['rag_sources']]}")
    print(f"\nResponse:\n{res['response']}")

