# Simple Question Answering App

A minimal React application with a question input field and an answer display area.

## Setup

1. Install dependencies:
```
npm install
```

2. Start the development server:
```
npm start
```

The application will open automatically in your browser at http://localhost:3000.

## Features

- Input field for entering questions
- Display area for showing answers
- Simple user interface

## Implementation

This application is built with:
- React
- TypeScript 

## Ollama Model Fine-tuning

This project includes a script to fine-tune an Ollama model with banking FAQ data:

### Prerequisites

1. Install [Ollama](https://ollama.com/) on your machine
2. Install [jq](https://jqlang.github.io/jq/download/) (used for JSON processing)
3. Prepare a `BankFAQs.csv` file with your banking Q&A data in the root directory

### Fine-tuning Steps

1. Run the fine-tuning script:
```
./fine_tune_bank_model.sh
```

2. Follow the interactive prompts:
   - The script will show a list of available models in your Ollama installation
   - Select a model number to use as the base model
   - The script will create a new directory with all necessary files for fine-tuning
   - It will convert your CSV data to the appropriate training format

3. Run the generated fine-tuning script:
```
./ollama_finetune_YYYYMMDD_HHMMSS/run_finetune.sh
```
   (Replace YYYYMMDD_HHMMSS with the actual timestamp in the directory name)

4. Once complete, your fine-tuned model will be available in Ollama with the name `bank-assistant-YYYYMMDD`

5. The script will attempt to update your server.js file to use the newly created model automatically

### Note

The fine-tuning process creates a model based on your banking FAQ data. The model is built using the Ollama create command with a carefully configured Modelfile that incorporates your training data. 