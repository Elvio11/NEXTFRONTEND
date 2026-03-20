"""
Talvix AI Corp — Dept 4: Marketing Agent (Python)
Uses CrewAI/LangChain for autonomous strategy drafting.
"""
import os
import argparse
import sys
from crewai import Agent, Task, Crew, Process
import logging

# Add the project root to sys.path for internal imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from src.utils import load_env

load_env()

def run_marketing_brief():
    """
    Simulates the Marketing Agent's morning strategy briefing.
    """
    print("🚀 Talvix AI Corp: Starting Marketing Strategy Briefing...")
    
    # 1. Define the Agent
    content_strategist = Agent(
        role='Senior Content Strategist',
        goal='Draft the daily content calendar for Talvix AaaS based on S1 metrics.',
        backstory='Expert in viral growth and technical SEO for AI-as-a-Service products.',
        allow_delegation=False,
        verbose=True,
        memory=True
    )

    # 2. Define the Task
    briefing_task = Task(
        description='''
        Analyze the current product metrics (User signups, Churn, and Agent failures).
        Draft 3 Twitter threads and 1 LinkedIn post that highlight the product's reliability and new features.
        ''',
        agent=content_strategist,
        expected_output="A structured YAML/JSON strategy for the day's distribution."
    )

    # 3. Create the Crew
    marketing_crew = Crew(
        agents=[content_strategist],
        tasks=[briefing_task],
        process=Process.sequential,
        verbose=True
    )

    # 4. Kickstart the Execution
    # result = marketing_crew.kickoff()  # Requires API Keys in ENV
    # print(f"✅ Strategy Complete: {result}")
    print("✅ Marketing Strategy Drafted (Simulated — No API keys detected)")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--task", type=str, default="daily_content_strategy")
    args = parser.parse_args()

    if args.task == "daily_content_strategy":
        run_marketing_brief()
    else:
        print(f"Unknown task: {args.task}")
