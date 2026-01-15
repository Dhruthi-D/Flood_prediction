"""
City Loader Module
Loads cities from CSV and provides search functionality.
"""
import pandas as pd
import os
from typing import List
from pathlib import Path

# Path to Cities.csv (assuming it's in the project root)
CSV_PATH = Path(__file__).parent.parent / "Cities.csv"

# Cache for loaded cities
_cities_cache: List[str] = None


def load_cities() -> List[str]:
    """
    Load city names from Cities.csv.
    Returns a list of unique city names.
    """
    global _cities_cache
    
    if _cities_cache is not None:
        return _cities_cache
    
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"Cities.csv not found at {CSV_PATH}")
    
    try:
        df = pd.read_csv(CSV_PATH)
        
        # Extract city names from 'Name' column
        if 'Name' not in df.columns:
            raise ValueError("'Name' column not found in Cities.csv")
        
        # Get unique city names, remove NaN values, and convert to list
        cities = df['Name'].dropna().unique().tolist()
        
        # Convert to strings and strip whitespace
        cities = [str(city).strip() for city in cities if str(city).strip()]
        
        # Remove duplicates (case-insensitive)
        seen = set()
        unique_cities = []
        for city in cities:
            city_lower = city.lower()
            if city_lower not in seen:
                seen.add(city_lower)
                unique_cities.append(city)
        
        _cities_cache = sorted(unique_cities)
        return _cities_cache
    
    except Exception as e:
        raise RuntimeError(f"Failed to load cities from CSV: {str(e)}")


def search_cities(query: str, limit: int = 10) -> List[str]:
    """
    Search cities by query (case-insensitive prefix and partial match).
    
    Args:
        query: Search query string
        limit: Maximum number of results to return (default: 10)
    
    Returns:
        List of matching city names (max limit)
    """
    if not query or len(query.strip()) < 1:
        return []
    
    cities = load_cities()
    query_lower = query.strip().lower()
    
    # Find matches (prefix match first, then partial match)
    prefix_matches = []
    partial_matches = []
    
    for city in cities:
        city_lower = city.lower()
        if city_lower.startswith(query_lower):
            prefix_matches.append(city)
        elif query_lower in city_lower and city not in prefix_matches:
            partial_matches.append(city)
    
    # Combine results (prefix matches first, then partial matches)
    results = prefix_matches + partial_matches
    
    # Remove duplicates and limit results
    seen = set()
    unique_results = []
    for city in results:
        if city not in seen:
            seen.add(city)
            unique_results.append(city)
            if len(unique_results) >= limit:
                break
    
    return unique_results


def city_exists(city_name: str) -> bool:
    """
    Check if a city exists in the CSV (case-insensitive).
    
    Args:
        city_name: City name to check
    
    Returns:
        True if city exists, False otherwise
    """
    cities = load_cities()
    city_lower = city_name.strip().lower()
    
    for city in cities:
        if city.lower() == city_lower:
            return True
    
    return False

