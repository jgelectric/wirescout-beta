
window.WS_TEMPLATES = {
  "general": {
    name:"General Walkthrough", icon:"🏠",
    sections:[
      {name:"Areas", type:"areas"},
      {name:"Panel", fields:["Service Size","Panel Brand","Main Breaker","Available Spaces","Panel Location"]},
      {name:"Photos", type:"photos"},
      {name:"Notes", type:"notes"},
      {name:"Final Check", checklist:["Panel photo taken","Panel capacity checked","Access conditions noted","Measurements recorded","Customer requests documented","Permit status selected","Inspection status selected"]}
    ]
  },
  "service": {
    name:"Service Upgrade", icon:"⚡",
    sections:[
      {name:"Service", pairs:["Service Size","Service Type","Meter","Exterior Disconnect"], fields:["Service Entrance Type","Utility Coordination"]},
      {name:"Panel", pairs:["Panel Amperage","Panel Location","Main Breaker","Panel Spaces"], fields:["Existing Panel Brand","Proposed Panel Brand","Subpanels"]},
      {name:"Grounding", yesno:["Ground Rods","Water Bond","Gas Bond","Intersystem Bonding"], fields:["Grounding Electrode Conductor","Existing Deficiencies"]},
      {name:"Measurements", measurements:["Service Entrance","Meter → Panel","Grounding Conductor","Water Bond","Other"]},
      {name:"Photos", type:"photos", photoCats:["Meter","Panel Closed","Panel Open","Service Entrance","Utility Connection","Grounding","Water Service","Disconnect","Proposed Equipment Location"]},
      {name:"Notes", type:"notes"},
      {name:"Final Check", checklist:["Service size confirmed","Utility connection photographed","Meter photographed","Panel open/closed photographed","Grounding checked","Water bond checked","Measurements recorded","Equipment locations confirmed","Permit status recorded","Inspection status recorded","Customer requests documented"]}
    ]
  },
  "ev": {
    name:"EV Charger", icon:"🔌",
    sections:[
      {name:"Charger", fields:["Manufacturer / Model","Charging Amperage","Circuit Amperage","Supply Responsibility"], yesno:["Hardwired","NEMA Receptacle"]},
      {name:"Panel", fields:["Panel Manufacturer","Panel Rating","Main Breaker","Available Spaces","Breaker Required"], yesno:["Load Calculation Required","Load Management Required"]},
      {name:"Route", measurements:["Panel → Charger"], fields:["Route","Conduit Type","Wall Penetrations"], yesno:["Conduit Required","Trenching Required"]},
      {name:"Location", fields:["Indoor / Outdoor","Mounting Surface","Parking Location"], yesno:["Cable Reach Checked","Wi‑Fi Available"]},
      {name:"Photos", type:"photos", photoCats:["Panel","Panel Interior","Charger Location","Wire Route","Exterior","Parking Space"]},
      {name:"Notes", type:"notes"},
      {name:"Final Check", checklist:["Panel photo taken","Available spaces checked","Load calculation decision made","Route measured","Charger location photographed","Permit status selected","Inspection status selected"]}
    ]
  },
  "generator": {
    name:"Generator", icon:"🔋",
    sections:[
      {name:"Generator", fields:["Type","Fuel","Generator Size","Manufacturer / Model","Supply Responsibility"]},
      {name:"Connection", fields:["Transfer Equipment","Service Amperage","Panel Manufacturer","Main Breaker"]},
      {name:"Loads", checklist:["Refrigerator","Furnace","Boiler","Well Pump","Sump Pump","Lighting","Kitchen","HVAC","Water Heater","Other"]},
      {name:"Install", measurements:["Panel → Generator"], fields:["Generator Location","Route"], yesno:["Gas Coordination Needed","Concrete Pad Required","Clearances Checked"]},
      {name:"Photos", type:"photos"},
      {name:"Notes", type:"notes"},
      {name:"Final Check", checklist:["Generator location confirmed","Transfer method selected","Loads documented","Route measured","Clearances checked","Permit status selected","Inspection status selected"]}
    ]
  },
  "panel": {
    name:"Panel / Subpanel", icon:"📦",
    sections:[
      {name:"Existing", fields:["Manufacturer","Amperage","Spaces","Circuits","Main Breaker / Main Lug","Location"]},
      {name:"Proposed", fields:["Work Type","New Amperage","New Spaces","Main Breaker / Main Lug","Feeder Size"], measurements:["Approx. Feeder Length"]},
      {name:"Protection", yesno:["AFCI Considerations","GFCI Considerations","Surge Protection"], fields:["Breaker Types","Grounding / Bonding Notes"]},
      {name:"Photos", type:"photos", photoCats:["Cover","Interior","Label","Main Breaker","Existing Wiring","Proposed Location"]},
      {name:"Notes", type:"notes"},
      {name:"Final Check", checklist:["Panel brand recorded","Amperage recorded","Spaces/circuits recorded","Feeder route measured","Photos taken","Permit status selected","Inspection status selected"]}
    ]
  },
  "kitchen": {
    name:"Kitchen Remodel", icon:"🍳",
    sections:[
      {name:"Lighting", quantities:["Recessed Lights","Pendants","Under‑Cabinet Lights","Decorative Fixtures","Switches","Dimmers"]},
      {name:"Countertops", quantities:["Countertop Receptacles","GFCI Receptacles","Island Receptacles","Peninsula Receptacles"]},
      {name:"Appliances", checklist:["Refrigerator","Range","Cooktop","Wall Oven","Microwave","Dishwasher","Disposal","Range Hood","Wine Refrigerator","Other"], fields:["Appliance Notes"]},
      {name:"Conditions", yesno:["Island Present","Cabinet Layout Available","New Walls","Basement / Crawlspace Access","Attic Access"], fields:["Existing Wiring Access"]},
      {name:"Photos", type:"photos"},
      {name:"Notes", type:"notes"},
      {name:"Final Check", checklist:["Lighting quantities complete","Countertop requirements noted","Appliances documented","Access conditions checked","Photos taken","Permit status selected","Inspection status selected"]}
    ]
  },
  "bath": {
    name:"Bathroom Remodel", icon:"🚿",
    sections:[
      {name:"Electrical", quantities:["Vanity Lights","Recessed Lights","Shower‑Rated Lights","GFCI Receptacles","Switches","Dimmers"], checklist:["Exhaust Fan","Fan/Light Combo","Heated Floor","Towel Warmer","Bidet Receptacle","Dedicated Circuit"]},
      {name:"Conditions", fields:["Fan Duct Route","Existing Circuit","Fixture Locations"], yesno:["Attic Access"]},
      {name:"Measurements", measurements:["Fan Duct Route","Fixture Spacing","Other"]},
      {name:"Photos", type:"photos"},
      {name:"Notes", type:"notes"},
      {name:"Final Check", checklist:["GFCI needs recorded","Fan/duct route checked","Dedicated loads recorded","Measurements complete","Photos taken","Permit status selected","Inspection status selected"]}
    ]
  },
  "lighting": {
    name:"Lighting", icon:"💡",
    sections:[
      {name:"Fixtures", quantities:["Recessed Lights","Ceiling Fixtures","Pendants","Sconces","Exterior Fixtures"], fields:["Fixture Type","Ceiling Height","Fixture Height","Fixture Supplied By"]},
      {name:"Controls", quantities:["Single Pole","3‑Way","4‑Way","Dimmers","Smart Controls","Occupancy Sensors"]},
      {name:"Recessed", fields:["Size","Wafer / Can / Other","Color Temperature","Trim Color"], measurements:["Spacing"]},
      {name:"Conditions", yesno:["Existing Wiring","New Wiring","Attic Access","Finished Ceiling"]},
      {name:"Photos", type:"photos"},
      {name:"Notes", type:"notes"},
      {name:"Final Check", checklist:["Fixture quantities recorded","Switching recorded","Ceiling conditions checked","Measurements complete","Photos taken","Permit status selected"]}
    ]
  },
  "servicecall": {
    name:"Service Call / Troubleshooting", icon:"🔧",
    sections:[
      {name:"Complaint", fields:["Customer Complaint"], checklist:["No Power","Breaker Tripping","Flickering","GFCI Tripping","Burning Smell","Device Not Working","Light Not Working","Intermittent Issue","Other"]},
      {name:"Testing", fields:["Voltage Readings","Current Readings","Continuity / Other Readings"], checklist:["Breaker Tested","GFCI Tested","Circuit Traced","Connections Checked"]},
      {name:"Findings", fields:["Suspected Problem","Confirmed Problem","Repair Performed","Additional Work Recommended","Parts Needed"], yesno:["Follow‑up Required"]},
      {name:"Photos", type:"photos"},
      {name:"Notes", type:"notes"},
      {name:"Final Check", checklist:["Complaint documented","Testing documented","Findings documented","Photos taken","Follow‑up decision recorded"]}
    ]
  },
  "remodel": {
    name:"Addition / Remodel", icon:"🏗️",
    sections:[
      {name:"Areas", type:"areas"},
      {name:"Project", fields:["New / Existing Construction","Plans / Drawing Notes"], yesno:["Plans Available","Framing Open","Attic Access","Basement Access","Service Capacity Checked","Panel Capacity Checked","Temporary Power Needed"]},
      {name:"Loads", checklist:["New Circuits","Smoke / CO","HVAC","Appliances","Exterior Work"]},
      {name:"Photos", type:"photos"},
      {name:"Notes", type:"notes"},
      {name:"Final Check", checklist:["All areas walked","Service/panel capacity checked","New circuits noted","Plans photographed","Photos taken","Permit status selected","Inspection status selected"]}
    ]
  },
  "commercial": {
    name:"Commercial", icon:"🏢",
    sections:[
      {name:"Space", fields:["Building / Space Type","Ceiling Type","Wall Construction","Ceiling Height"]},
      {name:"Electrical", checklist:["Service","Panels","Subpanels","Transformers","Lighting","Emergency Lighting","Exit Signs","Receptacles","Dedicated Circuits","Equipment","HVAC","Disconnects","Motor Loads","Data / Low Voltage"]},
      {name:"Conditions", fields:["Conduit Type"], yesno:["Lift Required","After‑Hours Work","Shutdown Required"]},
      {name:"Measurements", measurements:["Ceiling Height","Main Run","Other"]},
      {name:"Photos", type:"photos"},
      {name:"Notes", type:"notes"},
      {name:"Final Check", checklist:["Electrical systems documented","Work conditions documented","Measurements recorded","Photos taken","Permit status selected","Inspection status selected"]}
    ]
  },
  "custom": {
    name:"Custom Job", icon:"✏️",
    sections:[{name:"Custom", type:"custom"},{name:"Photos",type:"photos"},{name:"Notes",type:"notes"},{name:"Final Check",checklist:["Job reviewed before leaving"]}]
  }
};

window.WS_AREA_ITEMS = [
  "Recessed Lights","Ceiling Lights","Wall Lights / Sconces","Under‑Cabinet Lights",
  "Standard Receptacles","GFCI Receptacles","USB Receptacles","240V Receptacles","Dedicated Receptacles",
  "Single Pole Switches","3‑Way Switches","4‑Way Switches","Dimmers","Smart Switches",
  "Smoke Detectors","CO Detectors","Ceiling Fans","Exhaust Fans","TV / Data","Doorbell","Thermostat","Dedicated Circuits"
];
