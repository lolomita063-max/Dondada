import { describe, it, expect } from 'vitest';
import { classifyIntent, extractLeadData, getMissingLeadFields, getGreeting } from '../src/services/chatbotEngine';

describe('Intent Classification', () => {
  it('classifies greetings', () => {
    expect(classifyIntent('Hello there!').intent).toBe('greeting');
    expect(classifyIntent('Hi').intent).toBe('greeting');
    expect(classifyIntent('Good morning').intent).toBe('greeting');
    expect(classifyIntent('Hey, how are you?').intent).toBe('greeting');
  });

  it('classifies farewell', () => {
    expect(classifyIntent('Goodbye').intent).toBe('farewell');
    expect(classifyIntent('See you later').intent).toBe('farewell');
    expect(classifyIntent('Thanks for your help').intent).toBe('farewell');
  });

  it('classifies booking intent', () => {
    expect(classifyIntent('I want to book a demo').intent).toBe('booking');
    expect(classifyIntent('Schedule a meeting').intent).toBe('booking');
    expect(classifyIntent('Can I talk to someone?').intent).toBe('booking');
  });

  it('classifies FAQ', () => {
    expect(classifyIntent('How much does it cost?').intent).toBe('faq');
    expect(classifyIntent('What features do you have?').intent).toBe('faq');
    expect(classifyIntent('Do you integrate with HubSpot?').intent).toBe('faq');
  });

  it('classifies lead qualification', () => {
    expect(classifyIntent('My name is John').intent).toBe('lead_qualification');
    expect(classifyIntent('I work at Acme Corp').intent).toBe('lead_qualification');
    expect(classifyIntent('We need sales automation').intent).toBe('lead_qualification');
  });
});

describe('Lead Data Extraction', () => {
  it('extracts email', () => {
    const data = extractLeadData('My email is john@example.com');
    expect(data.email).toBe('john@example.com');
  });

  it('extracts name', () => {
    const data = extractLeadData('My name is John Smith');
    expect(data.name).toBe('John Smith');
  });

  it('extracts name with I\'m pattern', () => {
    const data = extractLeadData("I'm Jane from Acme");
    expect(data.name).toBe('Jane');
  });

  it('does not extract name when not present', () => {
    const data = extractLeadData('I need help with sales automation');
    expect(data.name).toBeUndefined();
  });

  it('extracts phone number', () => {
    const data = extractLeadData('Call me at 555-123-4567');
    expect(data.phone).toBe('555-123-4567');
  });
});

describe('Missing Lead Fields', () => {
  it('returns both name and email when both missing', () => {
    const missing = getMissingLeadFields({});
    expect(missing).toContain('name');
    expect(missing).toContain('email');
  });

  it('returns only email when name is present', () => {
    const missing = getMissingLeadFields({ name: 'John' });
    expect(missing).toEqual(['email']);
  });

  it('returns empty array when all fields present', () => {
    const missing = getMissingLeadFields({ name: 'John', email: 'john@test.com' });
    expect(missing).toEqual([]);
  });
});

describe('Greeting', () => {
  it('returns a greeting response', () => {
    const greeting = getGreeting();
    expect(greeting.message).toContain("Looking to automate");
    expect(greeting.intent.intent).toBe('greeting');
    expect(greeting.shouldCollectLeadInfo).toBe(true);
    expect(greeting.conversationPhase).toBe('initial');
  });
});
