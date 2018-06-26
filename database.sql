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
  station_name VARCHAR,
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
  sp_distance double precision,
  sp_duration double precision,
  sp_weight double precision,
  is_master boolean DEFAULT false,
  region smallint DEFAULT 0,
  CONSTRAINT name_unq UNIQUE (adi)
);

CREATE TABLE public.station_distance (
  adi VARCHAR,
  distance double precision,
  duration double precision,
  weight  double precision,
  CONSTRAINT adi_unq UNIQUE (adi)
);

CREATE TABLE public.route (
  ID SERIAL PRIMARY KEY,
  name VARCHAR,
  description VARCHAR,
  start VARCHAR,
  color VARCHAR,
  geojson VARCHAR,
  geom geography,
  total_passenger smallint DEFAULT 0,
  expected_passenger smallint DEFAULT 0,
  is_active boolean DEFAULT true,
  created_by VARCHAR,
  created_at TIMESTAMP
);


--helper queries

--check random daha generator result
select sum(weight) , count(*) from station where is_active=true

-- make stations inactive
update station set weight=0, is_active=false



SELECT *
from station where point && ST_MakeEnvelope(32.65781864176159,39.812199574374745,32.72188583831257,39.89100734156165 ,4326)

UPDATE station SET region = 1 
 where point && ST_MakeEnvelope(32.65781864176159,39.812199574374745,32.72188583831257,39.89100734156165 ,4326);



--UPDATE station SET point = ST_MakePoint(py, px);
