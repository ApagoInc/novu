#!/bin/bash

echo "env.sh - not doing anything unique with environment. This script is basically being skipped. The environment will be read from the .env file. Just copying an empty env-config.js in place, to keep from erroring."
# # Recreate config file
rm -rf ./env-config.js
touch ./env-config.js
exit 0


# # Add assignment
# echo "window._env_ = {" >>./env-config.js

# # Read each line in .env file
# # Each line represents key=value pairs
# while read -r line || [[ -n "$line" ]]; do
#   # Split env variables by character `=`
#   if printf '%s\n' "$line" | grep -q -e '='; then
#     varname=$(printf '%s\n' "$line" | sed -e 's/=.*//')
#     varvalue=$(printf '%s\n' "$line" | sed -e 's/^[^=]*=//')
#   fi

#   if [ -z "$varname" ]; then
#     continue
#   fi

#   # Read value of current variable if exists as Environment variable
#   value=$(printf '%s\n' "${!varname}")

#   # Otherwise use value from .env file
#   [[ -z $value ]] && value=${varvalue}

#   # Continue if no value
#   if [ -z "$value" ]; then
#     continue
#   fi

#   # Append configuration property to JS file
#   echo "  $varname: '$value'," >>./env-config.js
# done <.env

# echo "};" >>./env-config.js
