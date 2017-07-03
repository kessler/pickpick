# Experiments Engine

A/B testing engine (aka experiments)

- An experiement is composed of variations
- Each variation can have an arbitraty integer weight
- An experiment may return nothing from pick(), meaning that the provided targeting did not match any variation or sub experiments variations