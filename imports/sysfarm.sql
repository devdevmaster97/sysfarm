--
-- PostgreSQL database dump
--

\restrict fFNYNWtwMYpHImZqYbhj1PeaAMI3zD9wqNRgkUGWhZ009iZ8Khoq3FscJvBv6cU

-- Dumped from database version 12.17
-- Dumped by pg_dump version 18.2

-- Started on 2026-05-04 12:14:18

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
-- TOC entry 6 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 206 (class 1259 OID 70740)
-- Name: banco; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.banco (
    id_banco character varying(20) NOT NULL,
    nome character varying(100) NOT NULL,
    numero_agencia character varying(20) NOT NULL,
    numero_conta character varying(30) NOT NULL,
    cidade character varying(50) NOT NULL
);


ALTER TABLE public.banco OWNER TO postgres;

--
-- TOC entry 205 (class 1259 OID 70721)
-- Name: caixa; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.caixa (
    id_caixa integer NOT NULL,
    data_lancamento date NOT NULL,
    historico character varying(300) NOT NULL,
    valor numeric(15,2) NOT NULL,
    natureza character(1) NOT NULL,
    id_categoria_caixa integer NOT NULL,
    id_banco integer,
    CONSTRAINT caixa_natureza_check CHECK ((natureza = ANY (ARRAY['D'::bpchar, 'C'::bpchar]))),
    CONSTRAINT caixa_valor_check CHECK ((valor >= (0)::numeric))
);


ALTER TABLE public.caixa OWNER TO postgres;

--
-- TOC entry 204 (class 1259 OID 70719)
-- Name: caixa_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.caixa_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.caixa_id_seq OWNER TO postgres;

--
-- TOC entry 3712 (class 0 OID 0)
-- Dependencies: 204
-- Name: caixa_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.caixa_id_seq OWNED BY public.caixa.id_caixa;


--
-- TOC entry 203 (class 1259 OID 70708)
-- Name: categoria_caixa; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categoria_caixa (
    id_categoria_caixa integer NOT NULL,
    descricao text
);


ALTER TABLE public.categoria_caixa OWNER TO postgres;

--
-- TOC entry 202 (class 1259 OID 70706)
-- Name: categoria_caixa_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categoria_caixa_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categoria_caixa_id_seq OWNER TO postgres;

--
-- TOC entry 3713 (class 0 OID 0)
-- Dependencies: 202
-- Name: categoria_caixa_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categoria_caixa_id_seq OWNED BY public.categoria_caixa.id_categoria_caixa;


--
-- TOC entry 3568 (class 2604 OID 70724)
-- Name: caixa id_caixa; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caixa ALTER COLUMN id_caixa SET DEFAULT nextval('public.caixa_id_seq'::regclass);


--
-- TOC entry 3567 (class 2604 OID 70711)
-- Name: categoria_caixa id_categoria_caixa; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categoria_caixa ALTER COLUMN id_categoria_caixa SET DEFAULT nextval('public.categoria_caixa_id_seq'::regclass);


--
-- TOC entry 207 (class 1259 OID 70750)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id_usuario integer NOT NULL,
    nome character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    senha character varying(255) NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.usuarios OWNER TO postgres;

--
-- TOC entry 208 (class 1259 OID 70755)
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.usuarios_id_seq OWNER TO postgres;
ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id_usuario;
ALTER TABLE ONLY public.usuarios ALTER COLUMN id_usuario SET DEFAULT nextval('public.usuarios_id_seq'::regclass);

--
-- TOC entry 3580 (class 2606 OID 70760)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id_usuario);

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_unique UNIQUE (email);

-- Insert default admin user (password: admin123)
INSERT INTO public.usuarios (nome, email, senha, ativo) VALUES 
('Administrador', 'admin@sysfarm.com', 'admin123', true);


--
-- TOC entry 3578 (class 2606 OID 70744)
-- Name: banco banco_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.banco
    ADD CONSTRAINT banco_pkey PRIMARY KEY (id_banco);


--
-- TOC entry 3574 (class 2606 OID 70731)
-- Name: caixa caixa_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caixa
    ADD CONSTRAINT caixa_pkey PRIMARY KEY (id_caixa);


--
-- TOC entry 3572 (class 2606 OID 70716)
-- Name: categoria_caixa categoria_caixa_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categoria_caixa
    ADD CONSTRAINT categoria_caixa_pkey PRIMARY KEY (id_categoria_caixa);


--
-- TOC entry 3575 (class 1259 OID 70739)
-- Name: idx_caixa_categoria; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_caixa_categoria ON public.caixa USING btree (id_categoria_caixa);


--
-- TOC entry 3576 (class 1259 OID 70737)
-- Name: idx_caixa_data; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_caixa_data ON public.caixa USING btree (data_lancamento);


--
-- TOC entry 3579 (class 2606 OID 70732)
-- Name: caixa caixa_cod_categoria_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caixa
    ADD CONSTRAINT caixa_cod_categoria_fkey FOREIGN KEY (id_categoria_caixa) REFERENCES public.categoria_caixa(id_categoria_caixa) ON DELETE RESTRICT;


--
-- TOC entry 3711 (class 0 OID 0)
-- Dependencies: 6
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


-- Completed on 2026-05-04 12:14:29

--
-- PostgreSQL database dump complete
--

\unrestrict fFNYNWtwMYpHImZqYbhj1PeaAMI3zD9wqNRgkUGWhZ009iZ8Khoq3FscJvBv6cU

