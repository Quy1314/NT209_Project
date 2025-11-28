#!/usr/bin/env bash
set -euo pipefail

# Generates PKI assets for all Besu validators, rpcnode and EthSigner.
# Outputs are stored under Besu-hyperledger/config/tls/<node>/
# Default password for every keystore/truststore is "changeit".

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TLS_DIR="$BASE_DIR/config/tls"
ROOT_DIR="$TLS_DIR/root"
PASSWORD="changeit"

reset_dir() {
  local dir="$1"
  rm -rf "$dir"
  mkdir -p "$dir"
}

reset_dir "$ROOT_DIR"
CA_KEY="$ROOT_DIR/ca.key"
CA_CRT="$ROOT_DIR/ca.crt"

openssl genrsa -out "$CA_KEY" 4096
openssl req -x509 -new -key "$CA_KEY" -days 3650 \
  -out "$CA_CRT" -subj "/CN=InterbankRootCA" -sha256

create_keystore() {
  local node="$1"
  local endpoint="$2"
  local node_dir="$TLS_DIR/$node"
  mkdir -p "$node_dir"

  local key="$node_dir/${endpoint}.key"
  local csr="$node_dir/${endpoint}.csr"
  local crt="$node_dir/${endpoint}.crt"
  local p12="$node_dir/${endpoint}-keystore.p12"

  openssl genrsa -out "$key" 4096
  openssl req -new -key "$key" \
    -out "$csr" \
    -subj "/CN=${node}-${endpoint}"

  local serial="0x$(openssl rand -hex 16)"
  openssl x509 -req -in "$csr" -CA "$CA_CRT" -CAkey "$CA_KEY" \
    -out "$crt" -days 825 -sha256 -set_serial "$serial"

  openssl pkcs12 -export -out "$p12" \
    -inkey "$key" -in "$crt" -certfile "$CA_CRT" \
    -passout pass:$PASSWORD
}

NODES=(sbv vietcombank vietinbank bidv rpcnode member1besu member2besu member3besu)
for node in "${NODES[@]}"; do
  reset_dir "$TLS_DIR/$node"
  create_keystore "$node" "http"
  create_keystore "$node" "ws"
  openssl pkcs12 -export -out "$TLS_DIR/$node/clients-truststore.p12" \
    -nokeys -in "$CA_CRT" -passout pass:$PASSWORD
  echo "$PASSWORD" > "$TLS_DIR/$node/password.txt"
done

# EthSigner server + client certs
ETHSIGNER_DIR="$TLS_DIR/ethsigner"
reset_dir "$ETHSIGNER_DIR"
create_keystore "ethsigner" "server"
cp "$ETHSIGNER_DIR/server-keystore.p12" "$ETHSIGNER_DIR/http-keystore.p12"
cp "$ETHSIGNER_DIR/server-keystore.p12" "$ETHSIGNER_DIR/downstream-keystore.p12"
openssl pkcs12 -export -out "$ETHSIGNER_DIR/clients-truststore.p12" \
  -nokeys -in "$CA_CRT" -passout pass:$PASSWORD

# Known servers fingerprint for rpcnode
RPC_FINGERPRINT=$(openssl x509 -in "$TLS_DIR/rpcnode/http.crt" -fingerprint -sha256 -noout | awk -F= '{print $2}' | tr -d ':')
echo "rpcnode:8545 $RPC_FINGERPRINT" > "$ETHSIGNER_DIR/known-servers"
echo "$PASSWORD" > "$ETHSIGNER_DIR/password.txt"

# Sample client certificate for testing curl/GUI
CLIENT_DIR="$TLS_DIR/client-app"
reset_dir "$CLIENT_DIR"
openssl genrsa -out "$CLIENT_DIR/client.key" 4096
openssl req -new -key "$CLIENT_DIR/client.key" \
  -out "$CLIENT_DIR/client.csr" \
  -subj "/CN=ClientApp"
openssl x509 -req -in "$CLIENT_DIR/client.csr" -CA "$CA_CRT" -CAkey "$CA_KEY" \
  -out "$CLIENT_DIR/client.crt" -days 825 -sha256 -set_serial "0x$(openssl rand -hex 16)"
openssl pkcs12 -export -legacy -out "$CLIENT_DIR/client-app.p12" \
  -inkey "$CLIENT_DIR/client.key" -in "$CLIENT_DIR/client.crt" -certfile "$CA_CRT" \
  -passout pass:$PASSWORD -macalg sha256

CLIENT_FINGERPRINT=$(openssl x509 -in "$CLIENT_DIR/client.crt" -fingerprint -sha256 -noout | awk -F= '{print $2}' | tr -d ':')
echo "client-app $CLIENT_FINGERPRINT" > "$ETHSIGNER_DIR/known-clients"

echo "$PASSWORD" > "$TLS_DIR/common_password.txt"
echo "TLS assets generated under $TLS_DIR"
