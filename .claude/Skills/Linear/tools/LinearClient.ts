#!/usr/bin/env bun
/**
 * Linear API Client
 * 
 * Shared client for all Linear tools. Uses macOS keychain for auth.
 * 
 * Usage:
 *   import { linearQuery, linearMutation } from './LinearClient.ts';
 */

import { execSync } from 'child_process';

const ENDPOINT = 'https://api.linear.app/graphql';

// Get API key from macOS keychain
function getApiKey(): string {
  try {
    const key = execSync('security find-generic-password -s linear-api -a charles -w', {
      encoding: 'utf-8',
    }).trim();
    return key;
  } catch (error) {
    throw new Error('Failed to get Linear API key from keychain. Run: security add-generic-password -s linear-api -a charles -w YOUR_KEY');
  }
}

export interface LinearResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export async function linearQuery<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const apiKey = getApiKey();
  
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });

  const result: LinearResponse<T> = await response.json();
  
  if (result.errors) {
    throw new Error(`Linear API error: ${result.errors.map(e => e.message).join(', ')}`);
  }
  
  if (!result.data) {
    throw new Error('No data returned from Linear API');
  }
  
  return result.data;
}

export const linearMutation = linearQuery; // Same function, different semantic name

// Common IDs for BF Infrastructure project
export const BF_INFRA = {
  teamId: '15684d66-6303-4ded-9cea-14dfeea19b9d',
  teamKey: 'MML',
  projectId: '713157e0-2883-4329-b54d-fe2ca9170652',
  states: {
    backlog: '57ab3890-4ee6-4a89-8ce9-bd077d4c2709',
    todo: '02e5e9c4-8e92-4ff0-aff9-b5e84890ce39',
    inProgress: '4451e667-7eb1-4140-a37e-c57ccc7f770e',
    done: 'abf159b0-320d-4d1b-97a8-d218056311fb',
    canceled: 'd2c78f4c-c6d9-4fa2-9a90-47c59f5e1bf3',
  },
};
