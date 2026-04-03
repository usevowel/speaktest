# Residential Painting Estimate - Info Gathering Conversation Script

This script is designed for a painter (P) to gather essential details from a client (C) before providing an estimate. It uses **branching logic** based on client responses. The flow is structured as a decision tree with clear paths.

---

```mermaid
flowchart TD
    A[Start: Greeting & Purpose] --> B{Are you the homeowner?}
    B -- Yes --> C[Confirm property address]
    B -- No --> D[Who is the decision maker? Schedule follow-up?]
    D --> E[Schedule follow-up]
    
    C --> F{Project Type?}
    F -- Interior --> G[Interior Flow]
    F -- Exterior --> H[Exterior Flow]
    F -- Both --> I[Both Flow]
    
    %% INTERIOR FLOW
    G --> G1[How many rooms?]
    G1 --> G2[Room types? Bedrooms / Kitchen / etc.]
    G2 --> G3{Walls only or ceilings/trim?}
    G3 -- Walls only --> G4[Current wall condition?]
    G3 -- Ceilings + Trim --> G5[Ceiling height? Popcorn?]
    G4 & G5 --> G6{Color change?}
    G6 -- Same color --> G7[Existing paint type?]
    G6 -- Different color --> G8[How many colors per room?]
    G7 & G8 --> G9[Any repairs needed? Holes/cracks?]
    G9 -- Yes --> G10[Severity? DIY or pro repair?]
    G9 -- No --> G11[Furniture in rooms?]
    G11 -- Yes --> G12[Can you move it?]
    G11 -- No --> G13[Access to all walls?]
    G12 & G13 --> G14[Preferred timeline?]
    
    %% EXTERIOR FLOW
    H --> H1[House size? Sq ft or # stories?]
    H1 --> H2[Material? Brick / Stucco / Wood / Vinyl?]
    H2 --> H3{Previous paint? When?}
    H3 -- Never / >10 yrs --> H4[Peeling / Mildew?]
    H3 -- <5 yrs --> H5[Same color?]
    H4 & H5 --> H6[Trim / Shutters / Doors?]
    H6 --> H7[Decks / Fences included?]
    H7 --> H8[HOA rules or color restrictions?]
    H8 --> H9[Access issues? Dogs / Gates / Landscaping?]
    H9 --> H10[Preferred timeline? Weather dependent?]
    
    %% BOTH FLOW
    I --> I1[Start with Interior or Exterior first?]
    I1 -- Interior first --> G
    I1 -- Exterior first --> H
    
    %% FINAL PATH
    G14 & H10 --> Z[Schedule estimate]
    Z --> Z1[Send prep email: Move furniture, HOA, etc.]
    Z1 --> END[Thank you!]
```

---

## Step Scripts

### A - Start: Greeting & Purpose
**Script:** Hi, this is [Your Name] with [Company]. I'm here to gather details for your painting estimate. How can I help you today?

### B - Are you the homeowner?
**Script:** Great! Are you the homeowner or decision maker?

### C - Confirm property address
**Script:** Perfect. Can you confirm the property address for me?

### D - Who is the decision maker?
**Script:** May I speak with the homeowner or decision maker, or would you prefer to have them complete this survey at a better time?

### E - Schedule follow-up
**Script:** No problem. What would be a good time for them to complete this? We can send them a link to continue the survey then.

### F - Project Type?
**Script:** Excellent. Are we looking at interior painting, exterior painting, or both?

### G - Interior Flow
**Script:** Great, let's talk about the interior project.

### G1 - How many rooms?
**Script:** How many rooms are we painting?

### G2 - Room types?
**Script:** What types of rooms? For example, bedrooms, bathrooms, kitchen, living room?

### G3 - Walls only or ceilings/trim?
**Script:** For each room, are we doing walls only, or walls plus ceilings and trim?

### G4 - Current wall condition?
**Script:** What's the current condition of the walls? Any damage or repairs needed?

### G5 - Ceiling height? Popcorn?
**Script:** Are the ceilings standard 8 feet or higher? And do any have popcorn texture?

### G6 - Color change?
**Script:** Are you changing colors dramatically, like going from light to dark or vice versa?

### G7 - Existing paint type?
**Script:** Do you know the current paint finish? Like flat, eggshell, or semi-gloss?

### G8 - How many colors per room?
**Script:** Will each room have one color or are you planning accent walls?

### G9 - Any repairs needed?
**Script:** Are there any wall repairs needed? Things like nail holes, cracks, or water stains?

### G10 - Severity?
**Script:** Would you say these are minor repairs like nail holes, or major ones like cracks over a quarter inch?

### G11 - Furniture in rooms?
**Script:** Will furniture be staying in the rooms during painting?

### G12 - Can you move it?
**Script:** Are you able to move the furniture, or would you like us to handle that?

### G13 - Access to all walls?
**Script:** Do we have full access to all the walls?

### G14 - Preferred timeline?
**Script:** What's your preferred timeline for this project?

### H - Exterior Flow
**Script:** Perfect, let's discuss the exterior project.

### H1 - House size?
**Script:** What's your home's approximate square footage, or how many stories is it?

### H2 - Material?
**Script:** What's the exterior material? Is it brick, stucco, wood siding, or vinyl?

### H3 - Previous paint?
**Script:** When was the exterior last painted?

### H4 - Peeling / Mildew?
**Script:** Is there any peeling paint, chalking, or mildew that you've noticed?

### H5 - Same color?
**Script:** Are you keeping the same color or changing it?

### H6 - Trim / Shutters / Doors?
**Script:** Are we including trim, shutters, doors, or the garage in this project?

### H7 - Decks / Fences included?
**Script:** Do you have any decks, fences, or railings that need painting?

### H8 - HOA rules?
**Script:** Are you in an HOA with any color restrictions or approval requirements?

### H9 - Access issues?
**Script:** Are there any access issues we should know about? Like dogs, locked gates, or heavy landscaping?

### H10 - Preferred timeline?
**Script:** What's your preferred timeline? Keep in mind exterior painting is weather dependent.

### I - Both Flow
**Script:** Sounds good. We'll cover both interior and exterior. Would you like to start with the interior or exterior details first?

### I1 - Start with Interior or Exterior first?
**Script:** Let's begin with whichever is more important to you.

### Z - Schedule estimate
**Script:** Based on what you've shared, I'd like to schedule a free estimate to measure and confirm details. Are you available this week?

### Z1 - Send prep email
**Script:** Perfect! I'll send you a confirmation email with what to have ready, like furniture access, HOA documents, and color samples if you have them.

### END - Thank you!
**Script:** Thank you so much for your time! We'll see you on [date/time]. Have a great day!
