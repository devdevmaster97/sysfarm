#!/usr/bin/env python3
"""
Script para importar a planilha 'Caixa' do arquivo caixa.xls para o PostgreSQL (Supabase).
Uso: python upload_caixa.py --arquivo caixa.xls --conexao "postgresql://usuario:senha@host:porta/banco"
"""

import argparse
import os
import sys
import pandas as pd
from sqlalchemy import create_engine, text

def obter_string_conexao(args):
    if args.conexao:
        return args.conexao
    env_url = os.environ.get("DATABASE_URL")
    if env_url:
        return env_url
    print("ERRO: Nenhuma string de conexão fornecida. Use --conexao ou defina a variável DATABASE_URL.")
    sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Importar caixa.xls para PostgreSQL.")
    parser.add_argument("--arquivo", required=True, help="Caminho para o arquivo caixa.xls")
    parser.add_argument("--conexao", help="String de conexão PostgreSQL (ex: postgresql://user:pass@host:port/db)")
    parser.add_argument("--tabela", default="caixa", help="Nome da tabela de destino (padrão: caixa)")
    parser.add_argument("--se-existir", default="replace", choices=["replace", "append", "fail"],
                        help="Ação se a tabela já existir (padrão: replace)")
    args = parser.parse_args()

    conn_str = obter_string_conexao(args)

    # Lê o arquivo Excel (formato .xls) na aba "Caixa"
    print(f"Lendo arquivo: {args.arquivo}")
    try:
        df = pd.read_excel(args.arquivo, sheet_name="Caixa", engine="xlrd")
    except Exception as e:
        print(f"Erro ao ler o Excel: {e}")
        sys.exit(1)

    # Renomeia colunas para minúsculas
    df.columns = df.columns.str.lower()

    # Colunas esperadas no Excel (mapeadas para nomes do banco)
    mapa_colunas = {
        "id": "id_caixa",
        "banco": "id_banco",
        "data": "data_lancamento",
        "historico": "historico",
        "valor": "valor",
        "natureza": "natureza",
        "categoria": "id_categoria_caixa",
    }
    colunas_necessarias = list(mapa_colunas.keys())
    faltantes = [c for c in colunas_necessarias if c not in df.columns]
    if faltantes:
        print(f"Colunas faltantes no arquivo: {faltantes}")
        print(f"Colunas encontradas: {list(df.columns)}")
        sys.exit(1)

    # Renomeia colunas para os nomes esperados pelo banco
    df = df.rename(columns=mapa_colunas)

    # Limpeza e conversão de tipos
    df["data_lancamento"] = pd.to_datetime(df["data_lancamento"], errors="coerce")
    df["valor"] = pd.to_numeric(df["valor"], errors="coerce")
    df["natureza"] = df["natureza"].astype(str).str.upper().str.strip()
    for col in ["id_caixa", "id_banco", "id_categoria_caixa"]:
        df[col] = pd.to_numeric(df[col], errors="coerce").astype("Int64")

    # Remove linhas com dados críticos inválidos
    antes = len(df)
    df = df.dropna(subset=["data_lancamento", "valor", "natureza"])
    if len(df) < antes:
        print(f"Removidas {antes - len(df)} linhas com data/valor/natureza inválidos.")

    # Conecta ao banco e envia os dados
    print("Conectando ao Supabase...")
    engine = create_engine(conn_str)

    from sqlalchemy.types import Integer, String, Date, Numeric
    dtype_mapping = {
        "id_caixa": Integer(),
        "id_banco": Integer(),
        "data_lancamento": Date(),
        "historico": String(),
        "valor": Numeric(15, 2),
        "natureza": String(1),
        "id_categoria_caixa": Integer(),
    }

    print(f"Escrevendo na tabela '{args.tabela}' (se-existir={args.se_existir})...")
    df.to_sql(
        name=args.tabela,
        con=engine,
        if_exists=args.se_existir,
        index=False,
        dtype=dtype_mapping
    )

    # Tenta adicionar chave primária (se a tabela foi recriada)
    if args.se_existir == "replace":
        with engine.connect() as conn:
            try:
                conn.execute(text(f"ALTER TABLE {args.tabela} ADD PRIMARY KEY (id_caixa);"))
                conn.commit()
                print(f"Chave primária na coluna 'id_caixa' adicionada à tabela {args.tabela}.")
            except Exception as e:
                print(f"Não foi possível adicionar chave primária (pode já existir ou haver IDs duplicados): {e}")

    print(f"Sucesso! {len(df)} linhas importadas para '{args.tabela}'.")

if __name__ == "__main__":
    main()