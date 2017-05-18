# Prequisites/Setup

## mysql/elasticsearch
These two services are mounting local folders for persistence. Please update the folder path as needed

## Network(deprecated) 
We used to need to create a `lister-dev` network before consolidating two groups of docker services (`lister-docker-dev` and `infra`), now it should not be necessary, will use the default network created by docker compose
