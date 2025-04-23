#!/bin/bash

# Set error handling
set -e

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "Ollama is not installed. Please install it first."
    echo "Visit https://ollama.com/ for installation instructions."
    exit 1
fi

# Check for jq for JSON parsing
if ! command -v jq &> /dev/null; then
    echo "jq is required but not installed. Please install it first."
    echo "You can install it with: brew install jq (macOS) or apt-get install jq (Linux)"
    exit 1
fi

# Check if BankFAQs.csv exists
if [ ! -f "BankFAQs.csv" ]; then
    echo "Error: BankFAQs.csv file not found in the current directory."
    exit 1
fi

echo "=== Ollama Bank FAQ Fine-tuning Script ==="
echo

# Get list of models from Ollama
echo "Fetching available models from Ollama..."
MODELS_OUTPUT=$(ollama list 2>/dev/null)

if [ $? -ne 0 ] || [ -z "$MODELS_OUTPUT" ]; then
    echo "Failed to retrieve models from Ollama. Please ensure Ollama is running."
    exit 1
fi

# Skip header row and extract model names
MODELS_LIST=$(echo "$MODELS_OUTPUT" | tail -n +2 | awk '{print $1}' | sort)

if [ -z "$MODELS_LIST" ]; then
    echo "No models found in Ollama. Please pull a model first using 'ollama pull <model>'."
    exit 1
fi

# Print available models
echo "Available models:"
echo "$MODELS_LIST" | nl -w2 -s') '

# Prompt user to select a model
echo
echo "Please select a model number for fine-tuning:"
read -r model_number

# Get the selected model name
SELECTED_MODEL=$(echo "$MODELS_LIST" | sed -n "${model_number}p")

if [ -z "$SELECTED_MODEL" ]; then
    echo "Invalid selection. Please run the script again and select a valid number."
    exit 1
fi

echo "You selected: $SELECTED_MODEL"
echo

# Create directory for fine-tuning files
WORK_DIR="ollama_finetune_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$WORK_DIR"

# Format training data from BankFAQs.csv
echo "Preparing training data from BankFAQs.csv..."
CSV_HEADER=$(head -n 1 BankFAQs.csv)
TRAINING_FILE="$WORK_DIR/training_data.jsonl"

# Create an empty file
> "$TRAINING_FILE"

# Skip header and process each line
tail -n +2 BankFAQs.csv | while IFS=, read -r question answer category || [[ -n "$question" ]]; do
    # Remove quotes if present
    question="${question%\"}"
    question="${question#\"}"
    answer="${answer%\"}"
    answer="${answer#\"}"
    
    # Create the prompt format
    PROMPT="<|system|>You are a helpful bank assistant that provides accurate information about banking services.</|system|>
<|user|>$question</|user|>
<|assistant|>"
    
    # Create the completion
    COMPLETION="$answer</|assistant|>"
    
    # Create the JSON record
    echo "{\"prompt\": \"$PROMPT\", \"completion\": \"$COMPLETION\"}" >> "$TRAINING_FILE"
done

echo "Created training data with $(wc -l < "$TRAINING_FILE") examples."
echo

# Create Modelfile
MODELFILE="$WORK_DIR/Modelfile"
cat > "$MODELFILE" << EOF
FROM $SELECTED_MODEL
PARAMETER stop "<|assistant|>"
PARAMETER stop "</|assistant|>"
PARAMETER stop "<|user|>"
PARAMETER stop "</|user|>"
PARAMETER stop "<|system|>"
PARAMETER stop "</|system|>"

TEMPLATE """
{{ .System }}
{{ .Prompt }}
{{ .Response }}
"""

SYSTEM """You are a helpful bank assistant that provides accurate information based on the bank's FAQs."""

PARAMETER num_ctx 4096
EOF

echo "Created Modelfile for fine-tuning."
echo

# Create the fine-tuning script
FINETUNE_SCRIPT="$WORK_DIR/run_finetune.sh"
cat > "$FINETUNE_SCRIPT" << EOF
#!/bin/bash
cd "\$(dirname "\$0")"
echo "Starting fine-tuning process..."
ollama create bank-assistant-$(date +%Y%m%d) -f Modelfile
echo "Fine-tuning the model (this may take a while)..."
ollama_path=\$(which ollama)
echo "Fine-tuning complete!"
echo "You can now use your model with: ollama run bank-assistant-$(date +%Y%m%d)"
EOF

chmod +x "$FINETUNE_SCRIPT"

echo "Created fine-tuning script at $FINETUNE_SCRIPT"
echo
echo "To start the fine-tuning process, run:"
echo "./$WORK_DIR/run_finetune.sh"
echo
echo "Note: Fine-tuning may take a significant amount of time depending on your hardware."
echo "The fine-tuned model will be saved as 'bank-assistant-$(date +%Y%m%d)'." 