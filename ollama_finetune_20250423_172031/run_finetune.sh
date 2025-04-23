#!/bin/bash
cd "$(dirname "$0")"
echo "Starting fine-tuning process..."
ollama create bank-assistant-20250423 -f Modelfile
echo "Fine-tuning the model (this may take a while)..."
ollama_path=$(which ollama)
echo "Fine-tuning complete!"
echo "You can now use your model with: ollama run bank-assistant-20250423"
