#!/bin/bash
echo "--- Iniciando Build Debug ---"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Diretório atual: $(pwd)"
echo "Listando arquivos:"
ls -la
echo "Executando Vite Build..."
npx vite build
echo "Build finalizado com status: $?"
