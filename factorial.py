#!/usr/bin/env python3
"""
Factorial Calculator

This module provides various implementations of factorial calculation
with different approaches and optimizations.
"""

import math
import time
from typing import Union
from functools import lru_cache

def factorial_recursive(n: int) -> int:
    """
    Calculate factorial using recursion.
    
    Args:
        n (int): Non-negative integer
        
    Returns:
        int: Factorial of n
        
    Raises:
        ValueError: If n is negative
        RecursionError: If n is too large for recursion
    """
    if n < 0:
        raise ValueError("Factorial is not defined for negative numbers")
    if n == 0 or n == 1:
        return 1
    return n * factorial_recursive(n - 1)

def factorial_iterative(n: int) -> int:
    """
    Calculate factorial using iteration.
    
    Args:
        n (int): Non-negative integer
        
    Returns:
        int: Factorial of n
        
    Raises:
        ValueError: If n is negative
    """
    if n < 0:
        raise ValueError("Factorial is not defined for negative numbers")
    if n == 0 or n == 1:
        return 1
    
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result

@lru_cache(maxsize=128)
def factorial_cached(n: int) -> int:
    """
    Calculate factorial using recursion with memoization.
    
    Args:
        n (int): Non-negative integer
        
    Returns:
        int: Factorial of n
        
    Raises:
        ValueError: If n is negative
    """
    if n < 0:
        raise ValueError("Factorial is not defined for negative numbers")
    if n == 0 or n == 1:
        return 1
    return n * factorial_cached(n - 1)

def factorial_builtin(n: int) -> int:
    """
    Calculate factorial using Python's built-in math.factorial.
    
    Args:
        n (int): Non-negative integer
        
    Returns:
        int: Factorial of n
        
    Raises:
        ValueError: If n is negative or too large
    """
    return math.factorial(n)

def factorial_gamma(n: int) -> float:
    """
    Calculate factorial using the gamma function.
    This can handle non-integer values but returns float.
    
    Args:
        n (int): Non-negative number
        
    Returns:
        float: Factorial of n using gamma function
    """
    if n < 0:
        raise ValueError("Factorial is not defined for negative numbers")
    return math.gamma(n + 1)

def factorial_approximation(n: int) -> float:
    """
    Calculate factorial using Stirling's approximation.
    Good for very large numbers where exact calculation is impractical.
    
    Args:
        n (int): Non-negative integer
        
    Returns:
        float: Approximate factorial of n
    """
    if n < 0:
        raise ValueError("Factorial is not defined for negative numbers")
    if n == 0 or n == 1:
        return 1.0
    
    # Stirling's approximation: n! ≈ √(2πn) * (n/e)^n
    return math.sqrt(2 * math.pi * n) * (n / math.e) ** n

def benchmark_factorial(n: int, iterations: int = 1000) -> dict:
    """
    Benchmark different factorial implementations.
    
    Args:
        n (int): Number to calculate factorial for
        iterations (int): Number of iterations for timing
        
    Returns:
        dict: Benchmark results
    """
    functions = {
        'recursive': factorial_recursive,
        'iterative': factorial_iterative,
        'cached': factorial_cached,
        'builtin': factorial_builtin,
        'gamma': factorial_gamma,
        'approximation': factorial_approximation
    }
    
    results = {}
    
    for name, func in functions.items():
        try:
            start_time = time.time()
            for _ in range(iterations):
                result = func(n)
            end_time = time.time()
            
            results[name] = {
                'time': (end_time - start_time) / iterations,
                'result': result,
                'success': True
            }
        except Exception as e:
            results[name] = {
                'time': None,
                'result': None,
                'success': False,
                'error': str(e)
            }
    
    return results

def factorial_demo():
    """Demonstrate factorial calculations with different methods"""
    print("🧮 FACTORIAL CALCULATOR DEMO")
    print("=" * 40)
    
    test_numbers = [0, 1, 5, 10, 15, 20]
    
    for n in test_numbers:
        print(f"\nCalculating {n}!:")
        print("-" * 20)
        
        try:
            # Try different methods
            methods = [
                ('Iterative', factorial_iterative),
                ('Built-in', factorial_builtin),
                ('Cached Recursive', factorial_cached),
            ]
            
            for method_name, method_func in methods:
                try:
                    result = method_func(n)
                    print(f"{method_name:15}: {result:,}")
                except Exception as e:
                    print(f"{method_name:15}: Error - {e}")
        
        except Exception as e:
            print(f"Error calculating {n}!: {e}")

def main():
    """Main function for command-line usage"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Calculate factorial of a number')
    parser.add_argument('number', type=int, help='Number to calculate factorial for')
    parser.add_argument('--method', choices=['recursive', 'iterative', 'cached', 'builtin', 'gamma', 'approximation'],
                       default='iterative', help='Method to use for calculation')
    parser.add_argument('--benchmark', action='store_true', help='Run benchmark comparison')
    parser.add_argument('--demo', action='store_true', help='Run demonstration')
    
    args = parser.parse_args()
    
    if args.demo:
        factorial_demo()
        return
    
    if args.benchmark:
        print(f"🏁 Benchmarking factorial calculation for {args.number}!")
        results = benchmark_factorial(args.number)
        
        print(f"\nResults for {args.number}!:")
        print("-" * 50)
        for method, data in results.items():
            if data['success']:
                print(f"{method:15}: {data['result']:,} (Time: {data['time']:.6f}s)")
            else:
                print(f"{method:15}: Error - {data['error']}")
        return
    
    # Calculate factorial using specified method
    methods = {
        'recursive': factorial_recursive,
        'iterative': factorial_iterative,
        'cached': factorial_cached,
        'builtin': factorial_builtin,
        'gamma': factorial_gamma,
        'approximation': factorial_approximation
    }
    
    try:
        result = methods[args.method](args.number)
        print(f"{args.number}! = {result:,}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()