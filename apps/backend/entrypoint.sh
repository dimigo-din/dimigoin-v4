#!/bin/sh
doppler run -c "$deploy_type" -t "$doppler_token" -- npm --workspace @dimigoin-v4/backend run db:migrate
exec doppler run -c "$deploy_type" -t "$doppler_token" -- node apps/backend/dist/cluster.js
