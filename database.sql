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

CREATE TABLE public.route (
  ID SERIAL PRIMARY KEY,
  name VARCHAR,
  description VARCHAR,
  start VARCHAR,
  geojson VARCHAR,
  geom geography,
  total_passenger smallint DEFAULT 0,
  expected_passenger smallint DEFAULT 0,
  is_active boolean DEFAULT true
);


--helper queries

--check random daha generator result
select sum(weight) , count(*) from station where is_active=true

-- make stations inactive
update station set weight=0, is_active=false