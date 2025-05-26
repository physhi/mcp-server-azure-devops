#!/bin/bash

# Global variable to track if an error has occurred
ERROR_OCCURRED=0

# Function to handle errors without exiting the shell when sourced
handle_error() {
    local message=$1
    local reset_colors="\033[0m"
    echo -e "\033[0;31m$message$reset_colors"
    
    # Set the error flag
    ERROR_OCCURRED=1
    
    # If script is being sourced (. or source)
    if [[ "${BASH_SOURCE[0]}" != "${0}" ]] || [[ -n "$ZSH_VERSION" && "$ZSH_EVAL_CONTEXT" == *:file:* ]]; then
        echo "Script terminated with error. Returning to shell."
        # Reset colors to ensure shell isn't affected
        echo -e "$reset_colors"
        # The return will be caught by the caller
        return 1
    else
        # If script is being executed directly
        exit 1
    fi
}

# Function to check if we should continue after potential error points
should_continue() {
    if [ $ERROR_OCCURRED -eq 1 ]; then
        # Reset colors to ensure shell isn't affected
        echo -e "\033[0m"
        return 1
    fi
    return 0
}

# Ensure script is running with a compatible shell
if [ -z "$BASH_VERSION" ] && [ -z "$ZSH_VERSION" ]; then
    handle_error "This script requires bash or zsh to run. Please run it with: bash $(basename "$0") or zsh $(basename "$0")"
    return 1 2>/dev/null || exit 1
fi

# Set shell options for compatibility
if [ -n "$ZSH_VERSION" ]; then
    # ZSH specific settings
    setopt SH_WORD_SPLIT
    setopt KSH_ARRAYS
fi

# Colors for better output - ensure they're properly reset after use
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Azure DevOps MCP Server - Environment Setup${NC}"
echo "This script will help you set up your .env file with Azure DevOps credentials."
echo

# Clean up any existing create_pat.json file
if [ -f "create_pat.json" ]; then
    echo -e "${YELLOW}Cleaning up existing create_pat.json file...${NC}"
    rm -f create_pat.json
fi

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    handle_error "Error: Azure CLI is not installed.\nPlease install Azure CLI first: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    return 1 2>/dev/null || exit 1
fi
should_continue || return 1 2>/dev/null || exit 1

# Check if Azure DevOps extension is installed
echo -e "${YELLOW}Checking for Azure DevOps extension...${NC}"
az devops &> /dev/null
if [ $? -ne 0 ]; then
    echo "Azure DevOps extension not found. Installing..."
    az extension add --name azure-devops
    if [ $? -ne 0 ]; then
        handle_error "Failed to install Azure DevOps extension."
        return 1 2>/dev/null || exit 1
    else
        echo -e "${GREEN}Azure DevOps extension installed successfully.${NC}"
    fi
else
    echo "Azure DevOps extension is already installed."
fi
should_continue || return 1 2>/dev/null || exit 1

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    handle_error "Error: jq is not installed.\nPlease install jq first. On Ubuntu/Debian: sudo apt-get install jq\nOn macOS: brew install jq"
    return 1 2>/dev/null || exit 1
fi
should_continue || return 1 2>/dev/null || exit 1

# Check if already logged in
echo -e "\n${YELLOW}Step 1: Checking Azure CLI authentication...${NC}"
if ! az account show &> /dev/null; then
    echo "Not logged in. Initiating login..."
    az login --allow-no-subscriptions
    if [ $? -ne 0 ]; then
        handle_error "Failed to login to Azure CLI."
        return 1 2>/dev/null || exit 1
    fi
else
    echo -e "${GREEN}Already logged in to Azure CLI.${NC}"
fi
should_continue || return 1 2>/dev/null || exit 1

# Get Azure DevOps Organizations using REST API
echo -e "\n${YELLOW}Step 2: Fetching your Azure DevOps organizations...${NC}"
echo "This may take a moment..."

# First get the user profile
echo "Getting user profile..."
profile_response=$(az rest --method get --uri "https://app.vssps.visualstudio.com/_apis/profile/profiles/me?api-version=6.0" --resource "499b84ac-1321-427f-aa17-267ca6975798" 2>&1)
profile_status=$?

if [ $profile_status -ne 0 ]; then
    echo -e "${RED}Error: Failed to get user profile${NC}"
    echo -e "${RED}Status code: $profile_status${NC}"
    echo -e "${RED}Error response:${NC}"
    echo "$profile_response"
    echo
    echo "Manually provide your organization name instead."
    read -p "Enter your Azure DevOps organization name: " org_name
else
    echo "Profile API response:"
    echo "$profile_response"
    echo
    public_alias=$(echo "$profile_response" | jq -r '.publicAlias')
    
    if [ "$public_alias" = "null" ] || [ -z "$public_alias" ]; then
        echo -e "${RED}Failed to extract publicAlias from response.${NC}"
        echo "Full response was:"
        echo "$profile_response"
        echo
        echo "Manually provide your organization name instead."
        read -p "Enter your Azure DevOps organization name: " org_name
    else
        # Get organizations using the publicAlias
        echo "Fetching organizations..."
        orgs_result=$(az rest --method get --uri "https://app.vssps.visualstudio.com/_apis/accounts?memberId=$public_alias&api-version=6.0" --resource "499b84ac-1321-427f-aa17-267ca6975798")
        
        # Extract organization names from the response using jq
        orgs=$(echo "$orgs_result" | jq -r '.value[].accountName')
        
        if [ -z "$orgs" ]; then
            echo -e "${RED}No organizations found.${NC}"
            echo "Manually provide your organization name instead."
            read -p "Enter your Azure DevOps organization name: " org_name
        else
            # Display organizations for selection
            echo -e "\nYour Azure DevOps organizations:"
            i=1
            OLDIFS=$IFS
            IFS=$'\n'
            # Create array in a shell-agnostic way
            orgs_array=()
            while IFS= read -r line; do
                [ -n "$line" ] && orgs_array+=("$line")
            done <<< "$orgs"
            IFS=$OLDIFS
            
            # Check if array is empty
            if [ ${#orgs_array[@]} -eq 0 ]; then
                echo -e "${RED}Failed to parse organizations list.${NC}"
                echo "Manually provide your organization name instead."
                read -p "Enter your Azure DevOps organization name: " org_name
            else
                # Display organizations with explicit indexing
                for ((idx=0; idx<${#orgs_array[@]}; idx++)); do
                    echo "$((idx+1)) ${orgs_array[$idx]}"
                done
                
                # Prompt for selection
                read -p "Select an organization (1-${#orgs_array[@]}): " org_selection
                
                if [[ "$org_selection" =~ ^[0-9]+$ ]] && [ "$org_selection" -ge 1 ] && [ "$org_selection" -le "${#orgs_array[@]}" ]; then
                    org_name=${orgs_array[$((org_selection-1))]}
                else
                    handle_error "Invalid selection. Please run the script again."
                    return 1 2>/dev/null || exit 1
                fi
            fi
        fi
    fi
fi
should_continue || return 1 2>/dev/null || exit 1

org_url="https://dev.azure.com/$org_name"
echo -e "${GREEN}Using organization URL: $org_url${NC}"

# Get Default Project (Optional)
echo -e "\n${YELLOW}Step 3: Would you like to set a default project? (y/n)${NC}"
read -p "Select option: " set_default_project

default_project=""
if [[ "$set_default_project" = "y" || "$set_default_project" = "Y" ]]; then
    # Configure az devops to use the selected organization
    az devops configure --defaults organization=$org_url
    
    # List projects
    echo "Fetching projects from $org_name..."
    projects=$(az devops project list --query "value[].name" -o tsv)
    
    if [ $? -ne 0 ] || [ -z "$projects" ]; then
        echo -e "${YELLOW}No projects found or unable to list projects.${NC}"
        read -p "Enter a default project name (leave blank to skip): " default_project
    else
        # Display projects for selection
        echo -e "\nAvailable projects in $org_name:"
        OLDIFS=$IFS
        IFS=$'\n'
        # Create array in a shell-agnostic way
        projects_array=()
        while IFS= read -r line; do
            [ -n "$line" ] && projects_array+=("$line")
        done <<< "$projects"
        IFS=$OLDIFS
        
        # Check if array is empty
        if [ ${#projects_array[@]} -eq 0 ]; then
            echo -e "${YELLOW}Failed to parse projects list.${NC}"
            read -p "Enter a default project name (leave blank to skip): " default_project
        else
            # Display projects with explicit indexing
            for ((idx=0; idx<${#projects_array[@]}; idx++)); do
                echo "$((idx+1)) ${projects_array[$idx]}"
            done
            
            echo "$((${#projects_array[@]}+1)) Skip setting a default project"
            
            # Prompt for selection
            read -p "Select a default project (1-$((${#projects_array[@]}+1))): " project_selection
            
            if [[ "$project_selection" =~ ^[0-9]+$ ]] && [ "$project_selection" -ge 1 ] && [ "$project_selection" -lt "$((${#projects_array[@]}+1))" ]; then
                default_project=${projects_array[$((project_selection-1))]}
                echo -e "${GREEN}Using default project: $default_project${NC}"
            else
                echo "No default project selected."
            fi
        fi
    fi
fi

# Get Default Team (Optional)
echo -e "\n${YELLOW}Step 4: Would you like to set a default team? (y/n)${NC}"
read -p "Select option: " set_default_team

default_team=""
if [[ "$set_default_team" = "y" || "$set_default_team" = "Y" ]]; then
    if [ ! -z "$default_project" ]; then
        # List teams for the selected project
        echo "Fetching teams from project $default_project..."
        teams=$(az devops team list --project "$default_project" --query "value[].name" -o tsv 2>/dev/null)
        
        if [ $? -ne 0 ] || [ -z "$teams" ]; then
            echo -e "${YELLOW}No teams found or unable to list teams.${NC}"
            read -p "Enter a default team name (leave blank to skip): " default_team
        else
            # Display teams for selection
            echo -e "\nAvailable teams in $default_project:"
            OLDIFS=$IFS
            IFS=$'\n'
            # Create array in a shell-agnostic way
            teams_array=()
            while IFS= read -r line; do
                [ -n "$line" ] && teams_array+=("$line")
            done <<< "$teams"
            IFS=$OLDIFS
            
            # Check if array is empty
            if [ ${#teams_array[@]} -eq 0 ]; then
                echo -e "${YELLOW}Failed to parse teams list.${NC}"
                read -p "Enter a default team name (leave blank to skip): " default_team
            else
                # Display teams with explicit indexing
                for ((idx=0; idx<${#teams_array[@]}; idx++)); do
                    echo "$((idx+1)) ${teams_array[$idx]}"
                done
                
                echo "$((${#teams_array[@]}+1)) Skip setting a default team"
                
                # Prompt for selection
                read -p "Select a default team (1-$((${#teams_array[@]}+1))): " team_selection
                
                if [[ "$team_selection" =~ ^[0-9]+$ ]] && [ "$team_selection" -ge 1 ] && [ "$team_selection" -lt "$((${#teams_array[@]}+1))" ]; then
                    default_team=${teams_array[$((team_selection-1))]}
                    echo -e "${GREEN}Using default team: $default_team${NC}"
                else
                    echo "No default team selected."
                fi
            fi
        fi
    else
        echo -e "${YELLOW}Default project not set. Please set a default project first to list teams.${NC}"
        read -p "Enter a default team name (leave blank to skip): " default_team
    fi
fi

# Get Default Repository (Optional)
echo -e "\n${YELLOW}Step 5: Would you like to set a default repository? (y/n)${NC}"
read -p "Select option: " set_default_repository

default_repository=""
if [[ "$set_default_repository" = "y" || "$set_default_repository" = "Y" ]]; then
    if [ ! -z "$default_project" ]; then
        # List repositories for the selected project
        echo "Fetching repositories from project $default_project..."
        repositories=$(az repos list --project "$default_project" --query "[].name" -o tsv 2>/dev/null)
        
        if [ $? -ne 0 ] || [ -z "$repositories" ]; then
            echo -e "${YELLOW}No repositories found or unable to list repositories.${NC}"
            read -p "Enter a default repository name (leave blank to skip): " default_repository
        else
            # Display repositories for selection
            echo -e "\nAvailable repositories in $default_project:"
            OLDIFS=$IFS
            IFS=$'\n'
            # Create array in a shell-agnostic way
            repositories_array=()
            while IFS= read -r line; do
                [ -n "$line" ] && repositories_array+=("$line")
            done <<< "$repositories"
            IFS=$OLDIFS
            
            # Check if array is empty
            if [ ${#repositories_array[@]} -eq 0 ]; then
                echo -e "${YELLOW}Failed to parse repositories list.${NC}"
                read -p "Enter a default repository name (leave blank to skip): " default_repository
            else
                # Display repositories with explicit indexing
                for ((idx=0; idx<${#repositories_array[@]}; idx++)); do
                    echo "$((idx+1)) ${repositories_array[$idx]}"
                done
                
                echo "$((${#repositories_array[@]}+1)) Skip setting a default repository"
                
                # Prompt for selection
                read -p "Select a default repository (1-$((${#repositories_array[@]}+1))): " repository_selection
                
                if [[ "$repository_selection" =~ ^[0-9]+$ ]] && [ "$repository_selection" -ge 1 ] && [ "$repository_selection" -lt "$((${#repositories_array[@]}+1))" ]; then
                    default_repository=${repositories_array[$((repository_selection-1))]}
                    echo -e "${GREEN}Using default repository: $default_repository${NC}"
                else
                    echo "No default repository selected."
                fi
            fi
        fi
    else
        echo -e "${YELLOW}Default project not set. Please set a default project first to list repositories.${NC}"
        read -p "Enter a default repository name (leave blank to skip): " default_repository
    fi
fi

# Create .env file
echo -e "\n${YELLOW}Step 6: Creating .env file...${NC}"

cat > .env << EOF
# Azure DevOps MCP Server - Environment Variables

# Azure DevOps Organization Name (selected from your available organizations)
AZURE_DEVOPS_ORG=$org_name

# Azure DevOps Organization URL (required)
AZURE_DEVOPS_ORG_URL=$org_url


AZURE_DEVOPS_AUTH_METHOD=azure-identity
EOF

# Add default project if specified
if [ ! -z "$default_project" ]; then
cat >> .env << EOF

# Default Project to use when not specified
AZURE_DEVOPS_DEFAULT_PROJECT=$default_project
EOF
else
cat >> .env << EOF

# Default Project to use when not specified (optional)
# AZURE_DEVOPS_DEFAULT_PROJECT=your-default-project
EOF
fi

# Add default team if specified
if [ ! -z "$default_team" ]; then
cat >> .env << EOF

# Default Team to use when not specified
AZURE_DEVOPS_DEFAULT_TEAM=$default_team
EOF
else
cat >> .env << EOF

# Default Team to use when not specified (optional)
# AZURE_DEVOPS_DEFAULT_TEAM=your-default-team
EOF
fi

# Add default repository if specified
if [ ! -z "$default_repository" ]; then
cat >> .env << EOF

# Default Repository to use when not specified
AZURE_DEVOPS_DEFAULT_REPOSITORY=$default_repository
EOF
else
cat >> .env << EOF

# Default Repository to use when not specified (optional)
# AZURE_DEVOPS_DEFAULT_REPOSITORY=your-default-repository
EOF
fi

# Add remaining configuration
cat >> .env << EOF

# API Version to use (optional, defaults to latest)
# AZURE_DEVOPS_API_VERSION=6.0

# Server Configuration
PORT=3000
HOST=localhost

# Logging Level (debug, info, warn, error)
LOG_LEVEL=info
EOF

echo -e "\n${GREEN}Environment setup completed successfully!${NC}"
echo "Your .env file has been created with the following configuration:"
echo "- Organization: $org_name"
echo "- Organization URL: $org_url"
if [ ! -z "$default_project" ]; then
    echo "- Default Project: $default_project"
fi
if [ ! -z "$default_team" ]; then
    echo "- Default Team: $default_team"
fi
if [ ! -z "$default_repository" ]; then
    echo "- Default Repository: $default_repository"
fi
echo "- PAT: Created with expanded scopes for full integration"
echo
echo "You can now run your Azure DevOps MCP Server with:"
echo "  npm run dev"
echo
echo "You can also run integration tests with:"
echo "  npm run test:integration"

# At the end of the script, ensure colors are reset
echo -e "${NC}" 