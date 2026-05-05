--
-- PostgreSQL database dump
--

\restrict mPKUFOA2yhiBub14f97kaJiFBBedzIsynSPH9hQwp1cklQaJQ0YikAqqmxqjKeD

-- Dumped from database version 12.17
-- Dumped by pg_dump version 18.2

-- Started on 2026-05-05 12:08:41

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 3716 (class 0 OID 70740)
-- Dependencies: 206
-- Data for Name: banco; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.banco (id_banco, nome, numero_agencia, numero_conta, cidade) FROM stdin;
1	MOVIMENTO DO CAIXA			
2	SICOOB CREDIVAR- ANA CECILIA	15025-8	3180	VARGINHA-MG
3	SICOOB CREDIVAR- JOAO GUILHERME	15026-2	3180	VARGINHA
4	CREDCAM - JOAO FRANCISCO	9307-6	3104	CAMPOS GERAIS
5	CREDCAM - EVELINE E IARA	9305-0	3104	CAMPOS GERAIS
6	BRADESCO- ROBERTO GUEDES	160990-4	510	VARGINHA
7	ITAU- COOPERCAFEBRASIL	60737-4	0802	VARGINHA
8	BRADESCO- COOPERCAFEBRASIL	73960-0	510	VARGINHA
9	CAIXA ECONOMICA FEDERAL- BRUNA ZONTA	20802-4	1724	VARGINHA
10	BRADESCO- JOAO FRANCISCO	51762-3	0510	VARGINHA
11	BANCO DO BRASIL - ADELSON COSTA	140.000-2	3856-3	VARGINHA
12	BANCO DO BRASIL - JOÃO FRANCISCO PEREIRA FAZENDA	30.886-2	0032-9	VARGINHA
14	SANTANDER - ADELSON JUNIOR	02003233-1	3344	VARGINHA
15	SICOOB CREDCAM ADELSON JUNIOR	4556-0	3104	CORREGO DO OURO
16	BRADESCO JUNIOR	510	91838-5	VARGINHA
17	BRADESCO IARA			VARGINHA
\.


--
-- TOC entry 3713 (class 0 OID 70708)
-- Dependencies: 203
-- Data for Name: categoria_caixa; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categoria_caixa (id_categoria_caixa, descricao) FROM stdin;
1	COMBUSTIVEL
2	INVESTIMENTOS
4	ADUBO- SOLO
5	AGRONOMO
6	BORRACHARIA
7	CALCARIO / GESSO
9	CONTADOR
10	ENERGIA ELETRICA
11	ESTERCO+FRETE
12	FERRAMENTAS E UTENCILIOS
13	FGTS
14	IMPOSTOS
15	INSS / GPS
16	IPVA
17	MAO OBRA COLHEITA
18	SALARIOS
19	MAO OBRA ADMINISTRADOR
20	MATERIAL CONTRUCAO/REFORMA
21	TELEFONE/INTERNET
22	FRETE / TRANSPORTE
23	FERIAS
24	ARMAZENAGEM
25	CAFE
26	DESBROTA
27	DESPESAS GERAIS
28	MANUTENÃAO MAQUINARIOS/IMPLEMENTOS/MECANICA
29	SEGUROS
30	TARIFAS BANCARIAS
31	ADUBO-FOLIAR
32	INSUMOS AGRÃCOLAS
33	TRATOR MF 275 TRAÃADO
34	TRATOR LS  R60
35	TRATOR MF 4275
36	TRATOR VALTRA BF 75 TRAÃADO
37	OLEO DIESEL MÃQUINAS-SANTANA PETRÃLEO
38	GUARDA/VIGILÃNCIA
39	LIMPEZA/MANUTENÃÃO HORTA
40	DESPESA ALIMENTAÃÃO
41	MANUTENÃÃO STRADA HUGO
42	HORAS EXTRAS FUNCIONÃRIOS
43	ALUGUEL DE MÃQUINA
44	TRANSFERENCIA
45	MOV. DE CONTAS
46	13Â°SALÃRIO INTEGRAL
47	DEFENSÃVO/HERBICIDA
48	DIVERSOS ITENS
49	APORTE CAPITAL
50	MILHO
51	TÃRIFA E TAXAS BANCARIAS
52	COMISSÃO SAFRA
53	PAGAMENTO PRESTAÃÃO DE SERVIÃO
54	SAQUE
55	ENTRADA SAQUE
56	FINAME / FINANCIAMENTO BNDES
57	RESCISÃO
58	REVISÃO/CONSERTO COLHEITA. E TRATORES
59	REVISÃO/CONSERTO MIAC - VARREDEIRA
60	ENTRADA COOPARTICIPAÃÃO BENEFICIO COOXUPE
61	EMPRESTIMO
62	COLHEITA MANUAL
63	SUPERMERCADO
64	SERRALHEIRO
65	ICMS
66	CONSULTORIA CERTIFICAÃÃO AGROGENIUS
67	INSETICIDA
68	RETIRADA APORTE CAPITAL
69	DOCUMENTAÃÃO
70	SISTEMA
71	RETIRADA LUCRO SOCIO
72	APLICAÃÃO RENDA FIXA
73	MUDAS
74	COMPRA LAVADOR E SECADOR
75	COMPRA MAQUINÃRIO LAVADOR
76	COMPRA RECOLHEDORA
77	SISTEMA FAZENDA
\.


--
-- TOC entry 3715 (class 0 OID 70721)
-- Dependencies: 205
-- Data for Name: caixa; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.caixa (id_caixa, data_lancamento, historico, valor, natureza, id_categoria_caixa, id_banco) FROM stdin;
\.


--
-- TOC entry 3718 (class 0 OID 70812)
-- Dependencies: 208
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id_usuario, nome, email, senha, ativo, data_criacao) FROM stdin;
1	Administrador	admin@sysfarm.com	admin123	t	2026-05-04 13:48:43.05011
\.


--
-- TOC entry 3724 (class 0 OID 0)
-- Dependencies: 204
-- Name: caixa_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.caixa_id_seq', 1, false);


--
-- TOC entry 3725 (class 0 OID 0)
-- Dependencies: 202
-- Name: categoria_caixa_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categoria_caixa_id_seq', 1, false);


--
-- TOC entry 3726 (class 0 OID 0)
-- Dependencies: 207
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_usuario_seq', 1, true);


-- Completed on 2026-05-05 12:08:53

--
-- PostgreSQL database dump complete
--

\unrestrict mPKUFOA2yhiBub14f97kaJiFBBedzIsynSPH9hQwp1cklQaJQ0YikAqqmxqjKeD

