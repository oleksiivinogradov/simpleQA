#!/bin/bash

# Set error handling
set -e

# Change to the directory containing this script
cd "$(dirname "$0")"

MODEL_NAME="bank-assistant-$(date +%Y%m%d)"
echo "Model name will be: ${MODEL_NAME}"

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "Error: Ollama is not installed. Please install it first."
    echo "Visit https://ollama.com/ for installation instructions."
    exit 1
fi

# Check if Ollama service is running
if ! ollama list &> /dev/null; then
    echo "Error: Ollama service is not running. Please start it first."
    exit 1
fi

# Check if model already exists - if so, remove it
if ollama list | grep -q "${MODEL_NAME}"; then
    echo "Model ${MODEL_NAME} already exists. Removing it before recreating..."
    ollama rm ${MODEL_NAME}
fi

# Make sure we have the Modelfile
if [ ! -f "Modelfile" ]; then
    echo "Error: Modelfile not found in the current directory."
    exit 1
fi

# Check if the base model exists
BASE_MODEL=$(grep "FROM" Modelfile | cut -d " " -f 2)
if ! ollama list | grep -q "${BASE_MODEL}"; then
    echo "Warning: Base model ${BASE_MODEL} not found in Ollama models."
    echo "Attempting to pull it..."
    ollama pull ${BASE_MODEL} || { echo "Error: Failed to pull base model. Exiting."; exit 1; }
fi

echo "Starting model creation process..."

# Create the model
echo "Creating model from Modelfile..."
ollama create ${MODEL_NAME} -f Modelfile

# Check if the model was created
if ollama list | grep -q "${MODEL_NAME}"; then
    echo "Model creation complete and successful!"
    echo "Your model '${MODEL_NAME}' is now available."
    echo "You can use it with: ollama run ${MODEL_NAME}"
else
    echo "Error: Model not found after creation. Check Modelfile for errors."
    exit 1
fi

# Update the server.js file to use the new model
SERVER_JS_PATH="../../server.js"
if [ -f "${SERVER_JS_PATH}" ]; then
    echo "Updating server.js to use the new model..."
    # Replace the MODEL_NAME line in server.js
    sed -i '' "s/const MODEL_NAME = '.*';/const MODEL_NAME = '${MODEL_NAME}';/" ${SERVER_JS_PATH}
    echo "Server updated! Restart the server to use the new model."
else
    echo "Note: Couldn't find server.js to update automatically."
    echo "Please update the MODEL_NAME in server.js manually to: ${MODEL_NAME}"
fi 