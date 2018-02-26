DROP DATABASE IF EXISTS huservice;

CREATE DATABASE huservice
WITH
OWNER = postgres
ENCODING = 'UTF8'
LC_COLLATE = 'Turkish_Turkey.1254'
LC_CTYPE = 'Turkish_Turkey.1254'
TABLESPACE = pg_default

CREATE EXTENSION postgis;

CREATE TABLE public.location (
  ID SERIAL PRIMARY KEY,
  code VARCHAR,
  note VARCHAR,
  point geography,
  lat REAL,
  lon REAL,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);


CREATE TABLE public.station (
  ID SERIAL PRIMARY KEY,
  adi VARCHAR,
  yeri VARCHAR,
  hatlar VARCHAR,
  point geography,
  px REAL,
  py REAL,
  weight smallint DEFAULT 0,
  is_active boolean DEFAULT false,
  CONSTRAINT name_unq UNIQUE (adi)
);