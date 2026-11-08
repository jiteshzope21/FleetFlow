"""
FleetFlow Domain-Specific Small Language Model (SLM) Fine-Tuning Pipeline
Low-Rank Adaptation (LoRA) on Qwen/Qwen2.5-1.5B-Instruct using PyTorch & Transformers
"""

import os
import sys
import math
import time
import json
import random
import torch
import torch.nn as nn
from typing import List, Dict, Any, Tuple
from transformers import AutoModelForCausalLM, AutoTokenizer

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "dataset")
TRAIN_FILE = os.path.join(DATA_DIR, "train.jsonl")
VAL_FILE = os.path.join(DATA_DIR, "val.jsonl")
OUTPUT_MODEL_DIR = os.path.join(BASE_DIR, "models", "fleetflow_qwen_lora")
MODEL_ID = "Qwen/Qwen2.5-1.5B-Instruct"

# ----------------- LoRA Layer Implementation ----------------- #

class LoRALinear(nn.Module):
    def __init__(self, original_linear: nn.Linear, r: int = 16, lora_alpha: int = 32, lora_dropout: float = 0.05):
        super().__init__()
        self.original_linear = original_linear
        self.in_features = original_linear.in_features
        self.out_features = original_linear.out_features
        self.r = r
        self.lora_alpha = lora_alpha
        self.scaling = lora_alpha / r

        # Freeze base linear layer
        self.original_linear.weight.requires_grad = False
        if self.original_linear.bias is not None:
            self.original_linear.bias.requires_grad = False

        # Trainable LoRA weights
        self.lora_A = nn.Parameter(torch.empty(r, self.in_features, dtype=original_linear.weight.dtype, device=original_linear.weight.device))
        self.lora_B = nn.Parameter(torch.zeros(self.out_features, r, dtype=original_linear.weight.dtype, device=original_linear.weight.device))
        nn.init.kaiming_uniform_(self.lora_A, a=math.sqrt(5))
        self.dropout = nn.Dropout(p=lora_dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        orig = self.original_linear(x)
        # Low-rank adaptation: delta_W = (dropout(x) @ A.T) @ B.T * scaling
        delta = (self.dropout(x) @ self.lora_A.transpose(0, 1)) @ self.lora_B.transpose(0, 1)
        return orig + delta * self.scaling

def apply_lora_to_model(model: nn.Module, r: int = 16, lora_alpha: int = 32) -> Tuple[nn.Module, List[str]]:
    lora_targets = []
    # Qwen2.5 attention projections: q_proj, v_proj
    for name, module in model.named_modules():
        if hasattr(module, "q_proj") and isinstance(module.q_proj, nn.Linear):
            module.q_proj = LoRALinear(module.q_proj, r=r, lora_alpha=lora_alpha)
            lora_targets.append(f"{name}.q_proj")
        if hasattr(module, "v_proj") and isinstance(module.v_proj, nn.Linear):
            module.v_proj = LoRALinear(module.v_proj, r=r, lora_alpha=lora_alpha)
            lora_targets.append(f"{name}.v_proj")
            
    return model, lora_targets

# ----------------- Dataset Preparation ----------------- #

def load_jsonl(path: str) -> List[Dict[str, Any]]:
    items = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                items.append(json.loads(line))
    return items

def format_conversation_for_training(example: Dict[str, Any], tokenizer) -> Dict[str, torch.Tensor]:
    messages = example["messages"]
    # Separate prompt (system + user) from target (assistant)
    prompt_msgs = messages[:-1]
    assistant_msg = messages[-1]["content"]

    # Format using tokenizer chat template
    prompt_text = tokenizer.apply_chat_template(prompt_msgs, tokenize=False, add_generation_prompt=True)
    full_text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=False)

    prompt_ids = tokenizer.encode(prompt_text, add_special_tokens=False)
    full_ids = tokenizer.encode(full_text, add_special_tokens=False)

    # Max sequence length truncation
    max_len = 512
    if len(full_ids) > max_len:
        full_ids = full_ids[:max_len]

    # Target labels: mask prompt tokens with -100 so loss is only computed on assistant response
    labels = [-100] * len(full_ids)
    prompt_len = min(len(prompt_ids), len(full_ids))
    for i in range(prompt_len, len(full_ids)):
        labels[i] = full_ids[i]

    return {
        "input_ids": torch.tensor(full_ids, dtype=torch.long),
        "labels": torch.tensor(labels, dtype=torch.long)
    }

# ----------------- Training Loop ----------------- #

def train():
    seed = 42
    random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"============================================================")
    print(f"🚀 FLEETFLOW DOMAIN-SPECIFIC SLM FINE-TUNING PIPELINE")
    print(f"============================================================")
    print(f"Device: {device.upper()}")
    if device == "cuda":
        print(f"GPU: {torch.cuda.get_device_name(0)}")
        print(f"Available VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")

    print(f"\n1. Loading base model: '{MODEL_ID}'...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, local_files_only=True)
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        dtype=torch.bfloat16 if device == "cuda" else torch.float32,
        local_files_only=True
    ).to(device)

    # Count total parameters
    total_params = sum(p.numel() for p in model.parameters())
    print(f"   Total Base Model Parameters: {total_params:,}")

    # Freeze base model
    for param in model.parameters():
        param.requires_grad = False

    # Apply LoRA
    print("\n2. Applying LoRA adapters (Rank=16, Alpha=32) to attention projections...")
    model, target_layers = apply_lora_to_model(model, r=16, lora_alpha=32)
    
    # Calculate trainable parameters
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    trainable_pct = (trainable_params / total_params) * 100
    print(f"   Target Layers Adapted: {len(target_layers)}")
    print(f"   Trainable LoRA Parameters: {trainable_params:,} ({trainable_pct:.3f}% of total)")

    # Prepare datasets
    print("\n3. Loading and tokenizing training and validation datasets...")
    train_data_raw = load_jsonl(TRAIN_FILE)
    val_data_raw = load_jsonl(VAL_FILE)

    train_data = [format_conversation_for_training(ex, tokenizer) for ex in train_data_raw]
    val_data = [format_conversation_for_training(ex, tokenizer) for ex in val_data_raw]
    print(f"   Prepared {len(train_data)} training samples, {len(val_data)} validation samples.")

    # Training Hyperparameters
    epochs = 3
    lr = 2e-4
    grad_accum_steps = 2
    optimizer = torch.optim.AdamW(
        [p for p in model.parameters() if p.requires_grad],
        lr=lr,
        weight_decay=0.01
    )

    history = {
        "model_id": MODEL_ID,
        "adapter_type": "LoRA (Native PyTorch)",
        "r": 16,
        "alpha": 32,
        "trainable_params": trainable_params,
        "total_params": total_params,
        "trainable_percent": trainable_pct,
        "epochs": epochs,
        "learning_rate": lr,
        "train_samples": len(train_data),
        "val_samples": len(val_data),
        "epoch_metrics": [],
        "completed_at": None,
        "training_duration_seconds": 0
    }

    print("\n4. Starting Fine-Tuning Execution...")
    start_time = time.time()
    model.train()

    for epoch in range(1, epochs + 1):
        epoch_start = time.time()
        random.shuffle(train_data)
        total_loss = 0.0
        step_count = 0
        optimizer.zero_grad()

        for step, sample in enumerate(train_data, 1):
            input_ids = sample["input_ids"].unsqueeze(0).to(device)
            labels = sample["labels"].unsqueeze(0).to(device)

            outputs = model(input_ids=input_ids, labels=labels)
            loss = outputs.loss / grad_accum_steps
            loss.backward()

            total_loss += loss.item() * grad_accum_steps
            step_count += 1

            if step % grad_accum_steps == 0 or step == len(train_data):
                torch.nn.utils.clip_grad_norm_([p for p in model.parameters() if p.requires_grad], 1.0)
                optimizer.step()
                optimizer.zero_grad()

            if step % 20 == 0 or step == len(train_data):
                avg_loss_so_far = total_loss / step_count
                print(f"   Epoch {epoch}/{epochs} | Step {step:3d}/{len(train_data)} | Train Loss: {avg_loss_so_far:.4f}")

        train_loss = total_loss / max(1, step_count)

        # Validation evaluation
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for v_sample in val_data:
                v_ids = v_sample["input_ids"].unsqueeze(0).to(device)
                v_labels = v_sample["labels"].unsqueeze(0).to(device)
                v_out = model(input_ids=v_ids, labels=v_labels)
                val_loss += v_out.loss.item()
        val_loss = val_loss / max(1, len(val_data))
        perplexity = math.exp(min(val_loss, 20.0))

        epoch_duration = time.time() - epoch_start
        print(f"   >>> Epoch {epoch} Completed in {epoch_duration:.1f}s | Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | Val Perplexity: {perplexity:.2f}")

        history["epoch_metrics"].append({
            "epoch": epoch,
            "train_loss": round(train_loss, 4),
            "val_loss": round(val_loss, 4),
            "val_perplexity": round(perplexity, 2),
            "duration_seconds": round(epoch_duration, 1)
        })
        model.train()

    total_duration = time.time() - start_time
    history["training_duration_seconds"] = round(total_duration, 1)
    history["completed_at"] = time.strftime("%Y-%m-%d %H:%M:%S")

    # Save LoRA Adapter Artifacts
    print(f"\n5. Saving Fine-Tuned Model Adapter Checkpoint to {OUTPUT_MODEL_DIR}...")
    os.makedirs(OUTPUT_MODEL_DIR, exist_ok=True)

    lora_state_dict = {}
    for name, module in model.named_modules():
        if isinstance(module, LoRALinear):
            lora_state_dict[f"{name}.lora_A"] = module.lora_A.cpu()
            lora_state_dict[f"{name}.lora_B"] = module.lora_B.cpu()

    adapter_weights_path = os.path.join(OUTPUT_MODEL_DIR, "adapter_model.pt")
    torch.save(lora_state_dict, adapter_weights_path)

    # Save adapter configuration
    config = {
        "base_model_name_or_path": MODEL_ID,
        "peft_type": "LORA",
        "r": 16,
        "lora_alpha": 32,
        "lora_dropout": 0.05,
        "target_modules": ["q_proj", "v_proj"],
        "task_type": "CAUSAL_LM",
        "trained_date": history["completed_at"],
        "num_adapters_saved": len(lora_state_dict) // 2
    }
    with open(os.path.join(OUTPUT_MODEL_DIR, "adapter_config.json"), "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)

    with open(os.path.join(OUTPUT_MODEL_DIR, "training_history.json"), "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

    adapter_size_mb = os.path.getsize(adapter_weights_path) / (1024 * 1024)
    print(f"   Saved Adapter Weights: {adapter_weights_path} ({adapter_size_mb:.2f} MB)")
    print(f"   Saved Adapter Config:  {os.path.join(OUTPUT_MODEL_DIR, 'adapter_config.json')}")
    print(f"   Saved Training Logs:   {os.path.join(OUTPUT_MODEL_DIR, 'training_history.json')}")

    print("\n============================================================")
    print(f"🎉 FLEETFLOW DOMAIN SLM TRAINING SUCCESSFULLY COMPLETED!")
    print(f"Total Time: {total_duration:.1f}s | Final Val Loss: {history['epoch_metrics'][-1]['val_loss']} | Perplexity: {history['epoch_metrics'][-1]['val_perplexity']}")
    print(f"============================================================")
    return history

if __name__ == "__main__":
    train()

