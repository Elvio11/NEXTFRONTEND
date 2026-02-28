# Skill: anti_ban_guard

## Purpose
Centralized automation risk management system for Selenium-based application execution.

## Risk Detection Layers

1. Behavioral Pattern Monitoring
   - Track actions per minute
   - Detect repetitive click patterns
   - Detect constant timing intervals

2. Platform Signal Monitoring
   - Detect CAPTCHA frequency increase
   - Monitor HTTP response anomalies
   - Detect unusual redirect patterns

3. Session Health Monitoring
   - Track session duration
   - Track login frequency
   - Detect unexpected logout events

## Human Simulation Enforcement
- Inject random delay intervals (2–12 seconds variable)
- Add scroll behavior before click
- Add idle micro-pauses
- Randomize action sequences slightly

## Risk Thresholds

0–40  → Safe  
41–70 → Warning (reduce frequency)  
71–90 → Cooldown required  
91–100 → Immediate halt  

## Output Format
{
  risk_score: 0-100,
  session_status: "safe | warning | cooldown | blocked",
  recommended_action: "continue | reduce_speed | pause_session | terminate_session"
}