#!/bin/bash

# ServiceNow-OpenAI Integration Deployment Helper
# This script provides easy commands for deployment tasks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}🚀 ServiceNow-OpenAI Integration Deployment Helper${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_requirements() {
    print_info "Checking requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is required but not installed"
        exit 1
    fi
    
    # Check if in correct directory
    if [ ! -f "package.json" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    
    print_success "Requirements check passed"
}

show_help() {
    print_header
    echo "Usage: ./deployment/deploy.sh [command]"
    echo ""
    echo "Available commands:"
    echo "  interactive     Run interactive deployment wizard"
    echo "  quick <url>     Generate quick deployment guide for ServiceNow instance"
    echo "  config          Generate custom configuration scripts"
    echo "  test            Run deployment tests"
    echo "  validate        Show validation script location"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./deployment/deploy.sh interactive"
    echo "  ./deployment/deploy.sh quick https://dev12345.service-now.com"
    echo "  ./deployment/deploy.sh config --apiKey=sk-your-key --usernames=admin"
    echo ""
}

run_interactive() {
    print_header
    print_info "Starting interactive deployment..."
    npm run deploy
}

run_quick() {
    if [ -z "$1" ]; then
        print_error "ServiceNow instance URL is required for quick deployment"
        echo "Usage: ./deployment/deploy.sh quick https://your-instance.service-now.com"
        exit 1
    fi
    
    print_header
    print_info "Generating quick deployment guide for: $1"
    npm run deploy:quick -- --instance="$1"
}

run_config() {
    print_header
    print_info "Generating configuration scripts..."
    
    # Pass all additional arguments to the config generator
    shift # Remove 'config' from arguments
    npm run deploy:config -- "$@"
}

run_test() {
    print_header
    print_info "Running deployment tests..."
    npm test
}

show_validate() {
    print_header
    print_info "Validation script location:"
    echo "  📁 File: deployment/validation/comprehensive-validator.js"
    echo "  📋 Usage: Copy and paste the script content into ServiceNow Scripts - Background"
    echo "  🔗 ServiceNow: System Definition > Scripts - Background"
    echo ""
    print_warning "Run this script in ServiceNow AFTER importing the update set"
}

# Main script logic
case "${1:-help}" in
    "interactive")
        check_requirements
        run_interactive
        ;;
    "quick")
        check_requirements
        run_quick "$2"
        ;;
    "config")
        check_requirements
        run_config "$@"
        ;;
    "test")
        check_requirements
        run_test
        ;;
    "validate")
        show_validate
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
