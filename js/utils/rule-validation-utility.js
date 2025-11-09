// Rule Validation Utility
// This utility provides comprehensive validation for combination rules
// to prevent contradictory or conflicting rules

// Remove this line:
// var NFTApp = NFTApp || {}

window.NFTApp.ruleValidationUtility = {
  // Main validation function that checks if a new rule conflicts with existing rules
  validateRule: function (newRule, existingRules, isEdit = false, editRuleId = null) {
    console.log("Validating rule:", newRule)
    console.log("Against existing rules:", existingRules)

    if (!existingRules || existingRules.length === 0) {
      return { valid: true }
    }

    // Filter out the rule being edited if this is an edit operation
    const rulesToCheck = isEdit ? existingRules.filter((rule) => rule.id !== editRuleId) : existingRules

    // Check for direct contradictions
    const directContradiction = this.checkDirectContradictions(newRule, rulesToCheck)
    if (directContradiction && !directContradiction.valid) {
      return directContradiction
    }

    // Check for circular dependencies
    const circularDependency = this.checkCircularDependencies(newRule, rulesToCheck)
    if (circularDependency && !circularDependency.valid) {
      return circularDependency
    }

    // Check for conditional restriction conflicts
    const conditionalConflict = this.checkConditionalConflicts(newRule, rulesToCheck)
    if (conditionalConflict && !conditionalConflict.valid) {
      return conditionalConflict
    }

    // Check for trait-level conflicts
    const traitLevelConflict = this.checkTraitLevelConflicts(newRule, rulesToCheck)
    if (traitLevelConflict && !traitLevelConflict.valid) {
      return traitLevelConflict
    }

    // No conflicts found
    return { valid: true }
  },

  // Check for direct contradictions between rules (e.g., Always Combine vs Never Combine)
  checkDirectContradictions: function (newRule, existingRules) {
    for (const existingRule of existingRules) {
      // Skip if not the same applies to
      if (existingRule.appliesTo !== newRule.appliesTo) continue

      // Check for direct contradictions based on rule type
      if (this.areRulesContradictory(newRule.type, existingRule.type)) {
        // Check if the rules apply to the same layers/traits
        if (this.doRulesApplyToSameElements(newRule, existingRule)) {
          return {
            valid: false,
            conflictType: "direct-contradiction",
            existingRule: existingRule,
            message: `Cannot add "${this.getRuleTypeText(newRule.type)}" rule because a contradictory "${this.getRuleTypeText(existingRule.type)}" rule already exists for the same elements.`,
          }
        }
      }
    }

    // Check for conflicts between layer-level and trait-level rules
    for (const existingRule of existingRules) {
      if (
        (newRule.appliesTo === "between-traits" && existingRule.appliesTo === "between-layers") ||
        (newRule.appliesTo === "between-layers" && existingRule.appliesTo === "between-traits")
      ) {
        const layerRule = newRule.appliesTo === "between-layers" ? newRule : existingRule
        const traitRule = newRule.appliesTo === "between-traits" ? newRule : existingRule

        // Check if the traits belong to the layers in the layer rule
        const traitsFromFirstLayer = traitRule.firstTraits.some((trait) => trait.layerId === layerRule.firstLayerId)
        const traitsFromSecondLayer = traitRule.secondTraits.some((trait) => trait.layerId === layerRule.secondLayerId)

        // Also check the reverse layer order since for never/always combine, order doesn't matter
        const traitsFromFirstLayerReverse = traitRule.firstTraits.some(
          (trait) => trait.layerId === layerRule.secondLayerId,
        )
        const traitsFromSecondLayerReverse = traitRule.secondTraits.some(
          (trait) => trait.layerId === layerRule.firstLayerId,
        )

        // If traits are from both layers in the layer rule (in either order)
        if (
          (traitsFromFirstLayer && traitsFromSecondLayer) ||
          (traitsFromFirstLayerReverse && traitsFromSecondLayerReverse)
        ) {
          // Check if the rules are contradictory
          if (this.areRulesContradictory(layerRule.type, traitRule.type)) {
            return {
              valid: false,
              conflictType: "layer-trait-contradiction",
              existingRule: existingRule,
              message: `Cannot add "${this.getRuleTypeText(traitRule.type)}" rule for these traits because a contradictory "${this.getRuleTypeText(layerRule.type)}" rule already exists between their parent layers.`,
            }
          }
        }
      }
    }

    // Check for rules with the same elements but different types
    for (const existingRule of existingRules) {
      // Skip if not the same applies to
      if (existingRule.appliesTo !== newRule.appliesTo) continue

      // Check if the rules apply to the same elements
      if (this.doRulesApplyToSameElements(newRule, existingRule)) {
        // If the rules are of different types, it's a conflict
        if (newRule.type !== existingRule.type) {
          return {
            valid: false,
            conflictType: "different-rule-types",
            existingRule: existingRule,
            message: `Cannot add "${this.getRuleTypeText(newRule.type)}" rule because a "${this.getRuleTypeText(existingRule.type)}" rule already exists for the same elements. Please use a different rule type or modify the existing rule.`,
          }
        }
      }
    }

    return null
  },

  // Check for trait-level conflicts between rules
  checkTraitLevelConflicts: function (newRule, existingRules) {
    // Only check for trait-level conflicts if the new rule involves traits
    if (
      newRule.appliesTo !== "between-traits" &&
      newRule.appliesTo !== "layer-to-traits" &&
      newRule.appliesTo !== "traits-to-layer"
    ) {
      return null
    }

    for (const existingRule of existingRules) {
      // Skip if the existing rule doesn't involve traits
      if (
        existingRule.appliesTo !== "between-traits" &&
        existingRule.appliesTo !== "layer-to-traits" &&
        existingRule.appliesTo !== "traits-to-layer"
      ) {
        continue
      }

      // Check for conflicts between trait-specific rules
      if (newRule.appliesTo === "between-traits" && existingRule.appliesTo === "between-traits") {
        // Check if there's any overlap in the traits
        const newRuleFirstTraits = newRule.firstTraits.map((t) => t.id)
        const newRuleSecondTraits = newRule.secondTraits.map((t) => t.id)
        const existingRuleFirstTraits = existingRule.firstTraits.map((t) => t.id)
        const existingRuleSecondTraits = existingRule.secondTraits.map((t) => t.id)

        // Check for trait overlaps in both directions
        const hasOverlap =
          (this.doArraysIntersect(newRuleFirstTraits, existingRuleFirstTraits) &&
            this.doArraysIntersect(newRuleSecondTraits, existingRuleSecondTraits)) ||
          (this.doArraysIntersect(newRuleFirstTraits, existingRuleSecondTraits) &&
            this.doArraysIntersect(newRuleSecondTraits, existingRuleFirstTraits))

        if (hasOverlap && this.areRulesContradictory(newRule.type, existingRule.type)) {
          // Find the specific traits that overlap
          const overlappingFirstTraits = newRule.firstTraits.filter(
            (t) =>
              existingRule.firstTraits.some((et) => et.id === t.id) ||
              existingRule.secondTraits.some((et) => et.id === t.id),
          )
          const overlappingSecondTraits = newRule.secondTraits.filter(
            (t) =>
              existingRule.firstTraits.some((et) => et.id === t.id) ||
              existingRule.secondTraits.some((et) => et.id === t.id),
          )

          // Create a detailed message about the conflicting traits
          const traitNames = [
            ...overlappingFirstTraits.map((t) => `"${t.name}"`),
            ...overlappingSecondTraits.map((t) => `"${t.name}"`),
          ].join(", ")

          return {
            valid: false,
            conflictType: "trait-level-contradiction",
            existingRule: existingRule,
            message: `Cannot add "${this.getRuleTypeText(newRule.type)}" rule because it contradicts an existing "${this.getRuleTypeText(existingRule.type)}" rule for the traits: ${traitNames}.`,
          }
        }
      }

      // Check for conflicts between layer-to-traits and traits-to-layer rules
      if (
        (newRule.appliesTo === "layer-to-traits" && existingRule.appliesTo === "traits-to-layer") ||
        (newRule.appliesTo === "traits-to-layer" && existingRule.appliesTo === "layer-to-traits")
      ) {
        // Get the layer and traits from both rules
        const newRuleLayer = newRule.appliesTo === "layer-to-traits" ? newRule.layerId : newRule.layerId
        const existingRuleLayer =
          existingRule.appliesTo === "layer-to-traits" ? existingRule.layerId : existingRule.layerId

        // Check if the rules involve the same layer
        if (newRuleLayer === existingRuleLayer) {
          // Check if there's any overlap in the traits
          const newRuleTraits = newRule.traits.map((t) => t.id)
          const existingRuleTraits = existingRule.traits.map((t) => t.id)

          if (
            this.doArraysIntersect(newRuleTraits, existingRuleTraits) &&
            this.areRulesContradictory(newRule.type, existingRule.type)
          ) {
            // Find the specific traits that overlap
            const overlappingTraits = newRule.traits.filter((t) => existingRule.traits.some((et) => et.id === t.id))
            const traitNames = overlappingTraits.map((t) => `"${t.name}"`).join(", ")

            return {
              valid: false,
              conflictType: "layer-traits-contradiction",
              existingRule: existingRule,
              message: `Cannot add "${this.getRuleTypeText(newRule.type)}" rule because it contradicts an existing "${this.getRuleTypeText(existingRule.type)}" rule for the layer "${newRule.layerName}" and traits: ${traitNames}.`,
            }
          }
        }
      }

      // Check for conflicts between between-traits and layer-to-traits/traits-to-layer rules
      if (
        (newRule.appliesTo === "between-traits" &&
          (existingRule.appliesTo === "layer-to-traits" || existingRule.appliesTo === "traits-to-layer")) ||
        ((newRule.appliesTo === "layer-to-traits" || newRule.appliesTo === "traits-to-layer") &&
          existingRule.appliesTo === "between-traits")
      ) {
        // Get the between-traits rule and the layer-traits rule
        const betweenTraitsRule = newRule.appliesTo === "between-traits" ? newRule : existingRule
        const layerTraitsRule = newRule.appliesTo === "between-traits" ? existingRule : newRule

        // Get the layer ID from the layer-traits rule
        const layerId = layerTraitsRule.layerId

        // Check if the between-traits rule involves traits from the same layer
        const firstTraitsFromLayer = betweenTraitsRule.firstTraits.some((t) => t.layerId === layerId)
        const secondTraitsFromLayer = betweenTraitsRule.secondTraits.some((t) => t.layerId === layerId)

        if (firstTraitsFromLayer || secondTraitsFromLayer) {
          // Get the traits from the layer-traits rule
          const layerTraitsIds = layerTraitsRule.traits.map((t) => t.id)

          // Get the traits from the between-traits rule that are from the same layer
          const betweenTraitsFirstIds = betweenTraitsRule.firstTraits
            .filter((t) => t.layerId === layerId)
            .map((t) => t.id)
          const betweenTraitsSecondIds = betweenTraitsRule.secondTraits
            .filter((t) => t.layerId === layerId)
            .map((t) => t.id)

          // Check if there's any overlap in the traits
          const hasOverlapFirst = this.doArraysIntersect(betweenTraitsFirstIds, layerTraitsIds)
          const hasOverlapSecond = this.doArraysIntersect(betweenTraitsSecondIds, layerTraitsIds)

          if (
            (hasOverlapFirst || hasOverlapSecond) &&
            this.areRulesContradictory(betweenTraitsRule.type, layerTraitsRule.type)
          ) {
            // Find the specific traits that overlap
            const overlappingFirstTraits = betweenTraitsRule.firstTraits.filter((t) =>
              layerTraitsRule.traits.some((lt) => lt.id === t.id),
            )
            const overlappingSecondTraits = betweenTraitsRule.secondTraits.filter((t) =>
              layerTraitsRule.traits.some((lt) => lt.id === t.id),
            )
            const traitNames = [
              ...overlappingFirstTraits.map((t) => `"${t.name}"`),
              ...overlappingSecondTraits.map((t) => `"${t.name}"`),
            ].join(", ")

            return {
              valid: false,
              conflictType: "mixed-traits-contradiction",
              existingRule: betweenTraitsRule === existingRule ? existingRule : layerTraitsRule,
              message: `Cannot add "${this.getRuleTypeText(newRule.type)}" rule because it contradicts an existing "${this.getRuleTypeText(existingRule.type)}" rule for the traits: ${traitNames}.`,
            }
          }
        }
      }
    }

    return null
  },

  // Check if two rule types are contradictory
  areRulesContradictory: (ruleType1, ruleType2) => {
    // Direct contradictions
    if (
      (ruleType1 === "never-combine" && ruleType2 === "always-combine") ||
      (ruleType1 === "always-combine" && ruleType2 === "never-combine")
    ) {
      return true
    }
    return false
  },

  // Check if two rules apply to the same elements (layers or traits)
  doRulesApplyToSameElements: (rule1, rule2) => {
    switch (rule1.appliesTo) {
      case "between-layers":
        // Check if the same layers are involved (in any order for never/always combine)
        return (
          (rule1.firstLayerId === rule2.firstLayerId && rule1.secondLayerId === rule2.secondLayerId) ||
          (rule1.firstLayerId === rule2.secondLayerId && rule1.secondLayerId === rule2.firstLayerId)
        )

      case "between-traits":
        // For trait-based rules, check if the same traits are involved
        const rule1FirstTraitIds = rule1.firstTraits.map((t) => t.id).sort()
        const rule1SecondTraitIds = rule1.secondTraits.map((t) => t.id).sort()
        const rule2FirstTraitIds = rule2.firstTraits.map((t) => t.id).sort()
        const rule2SecondTraitIds = rule2.firstTraits.map((t) => t.id).sort()

        // Check if the same traits are involved (in any order for never/always combine)
        if (
          rule1.type === "never-combine" ||
          rule1.type === "always-combine" ||
          rule2.type === "never-combine" ||
          rule2.type === "always-combine"
        ) {
          return (
            (JSON.stringify(rule1FirstTraitIds) === JSON.stringify(rule2FirstTraitIds) &&
              JSON.stringify(rule1SecondTraitIds) === JSON.stringify(rule2SecondTraitIds)) ||
            (JSON.stringify(rule1FirstTraitIds) === JSON.stringify(rule2SecondTraitIds) &&
              JSON.stringify(rule1SecondTraitIds) === JSON.stringify(rule2FirstTraitIds))
          )
        } else {
          // For conditional and always-on-top, order matters
          return (
            JSON.stringify(rule1FirstTraitIds) === JSON.stringify(rule2FirstTraitIds) &&
            JSON.stringify(rule1SecondTraitIds) === JSON.stringify(rule2SecondTraitIds)
          )
        }

      case "layer-to-traits":
      case "traits-to-layer":
        // Check if the same layer and traits are involved
        if (rule1.layerId !== rule2.layerId) return false

        const rule1TraitIds = rule1.traits.map((t) => t.id).sort()
        const rule2TraitIds = rule2.traits.map((t) => t.id).sort()

        return JSON.stringify(rule1TraitIds) === JSON.stringify(rule2TraitIds)

      default:
        return false
    }
  },

  // Check for circular dependencies (e.g., A always on top of B, and B always on top of A)
  checkCircularDependencies: (newRule, existingRules) => {
    // Only check for circular dependencies with "always-on-top" or "always-on-bottom" rules
    if (newRule.type !== "always-on-top" && newRule.type !== "always-on-bottom") return null

    for (const existingRule of existingRules) {
      // Skip if not always-on-top or always-on-bottom
      if (existingRule.type !== "always-on-top" && existingRule.type !== "always-on-bottom") continue

      // Skip if not the same applies to
      if (existingRule.appliesTo !== newRule.appliesTo) continue

      // Check for contradictions between always-on-top and always-on-bottom rules
      if ((newRule.type === "always-on-top" && existingRule.type === "always-on-bottom") ||
          (newRule.type === "always-on-bottom" && existingRule.type === "always-on-top")) {
        // Check for conflicting layer relationships
        if (newRule.appliesTo === "between-layers") {
          if (newRule.firstLayerId === existingRule.firstLayerId && 
              newRule.secondLayerId === existingRule.secondLayerId) {
            return {
              valid: false,
              conflictType: "contradictory-rules",
              existingRule: existingRule,
              message: `Cannot add this "${newRule.type === "always-on-top" ? "Always on Top" : "Always on Bottom"}" rule because it contradicts an existing "${existingRule.type === "always-on-top" ? "Always on Top" : "Always on Bottom"}" rule. Layer "${newRule.firstLayerName}" cannot be both above and below layer "${newRule.secondLayerName}".`,
            }
          }
        }
      }

      switch (newRule.appliesTo) {
        case "between-layers":
          // Check for circular dependency between layers
          if (
            newRule.firstLayerId === existingRule.secondLayerId &&
            newRule.secondLayerId === existingRule.firstLayerId
          ) {
            return {
              valid: false,
              conflictType: "circular-dependency",
              existingRule: existingRule,
              message: `Cannot add this "${newRule.type === "always-on-top" ? "Always on Top" : "Always on Bottom"}" rule because it creates a circular dependency with an existing rule. Layer "${newRule.firstLayerName}" cannot be both above and below layer "${newRule.secondLayerName}".`,
            }
          }
          break

        case "between-traits":
          // Check for circular dependency between traits
          const newRuleFirstTraitIds = newRule.firstTraits.map((t) => t.id).sort()
          const newRuleSecondTraitIds = newRule.secondTraits.map((t) => t.id).sort()
          const existingRuleFirstTraitIds = existingRule.firstTraits.map((t) => t.id).sort()
          const existingRuleSecondTraitIds = existingRule.secondTraits.map((t) => t.id).sort()

          // If the traits are reversed, it's a circular dependency
          if (
            JSON.stringify(newRuleFirstTraitIds) === JSON.stringify(existingRuleSecondTraitIds) &&
            JSON.stringify(newRuleSecondTraitIds) === JSON.stringify(existingRuleFirstTraitIds)
          ) {
            return {
              valid: false,
              conflictType: "circular-dependency-traits",
              existingRule: existingRule,
              message: `Cannot add this "${newRule.type === "always-on-top" ? "Always on Top" : "Always on Bottom"}" rule because it creates a circular dependency with an existing rule. The selected traits cannot be both above and below each other.`,
            }
          }
          break

        case "layer-to-traits":
        case "traits-to-layer":
          // Check for circular dependency between layer and traits
          if (
            (newRule.appliesTo === "layer-to-traits" && existingRule.appliesTo === "traits-to-layer") ||
            (newRule.appliesTo === "traits-to-layer" && existingRule.appliesTo === "layer-to-traits")
          ) {
            // Check if the same layer and traits are involved
            if (newRule.layerId === existingRule.layerId) {
              const newRuleTraitIds = newRule.traits.map((t) => t.id).sort()
              const existingRuleTraitIds = existingRule.traits.map((t) => t.id).sort()

              if (JSON.stringify(newRuleTraitIds) === JSON.stringify(existingRuleTraitIds)) {
                return {
                  valid: false,
                  conflictType: "circular-dependency-layer-traits",
                  existingRule: existingRule,
                  message: `Cannot add this "${newRule.type === "always-on-top" ? "Always on Top" : "Always on Bottom"}" rule because it creates a circular dependency with an existing rule. The layer and traits cannot be both above and below each other.`,
                }
              }
            }
          }
          break
      }
    }
    return null
  },

  // Check for conflicts between conditional restrictions and other rules
  checkConditionalConflicts: function (newRule, existingRules) {
    // If the new rule is a conditional restriction, check against never/always combine rules
    if (newRule.type === "conditional-restriction") {
      for (const existingRule of existingRules) {
        if (existingRule.type === "never-combine" || existingRule.type === "always-combine") {
          // Check if they involve the same layers/traits
          if (this.doConditionalAndStandardRulesConflict(newRule, existingRule)) {
            return {
              valid: false,
              conflictType: "conditional-conflict",
              existingRule: existingRule,
              message: `Cannot add this "Conditional Restriction" rule because it may conflict with an existing "${this.getRuleTypeText(existingRule.type)}" rule for the same elements.`,
            }
          }
        }
      }
    }

    // If the new rule is never/always combine, check against conditional restrictions
    if (newRule.type === "never-combine" || newRule.type === "always-combine") {
      for (const existingRule of existingRules) {
        if (existingRule.type === "conditional-restriction") {
          // Check if they involve the same layers/traits
          if (this.doConditionalAndStandardRulesConflict(existingRule, newRule)) {
            return {
              valid: false,
              conflictType: "conditional-conflict",
              existingRule: existingRule,
              message: `Cannot add this "${this.getRuleTypeText(newRule.type)}" rule because it may conflict with an existing "Conditional Restriction" rule for the same elements.`,
            }
          }
        }
      }
    }

    return null
  },

  // Check if a conditional rule conflicts with a standard rule
  doConditionalAndStandardRulesConflict: function (conditionalRule, standardRule) {
    // This is a simplified implementation - in a real system, you would need more complex logic
    // to determine if a conditional restriction conflicts with never/always combine rules

    if (conditionalRule.appliesTo !== standardRule.appliesTo) return false

    switch (conditionalRule.appliesTo) {
      case "between-layers":
        // Check if the same layers are involved
        return (
          (conditionalRule.firstLayerId === standardRule.firstLayerId &&
            conditionalRule.secondLayerId === standardRule.secondLayerId) ||
          (conditionalRule.firstLayerId === standardRule.secondLayerId &&
            conditionalRule.secondLayerId === standardRule.firstLayerId)
        )

      case "between-traits":
        // This would require more complex logic to check trait overlaps
        // For simplicity, we'll just check if any traits are shared
        const conditionalFirstTraits = conditionalRule.firstTraits.map((t) => t.id)
        const conditionalSecondTraits = conditionalRule.secondTraits.map((t) => t.id)
        const standardFirstTraits = standardRule.firstTraits.map((t) => t.id)
        const standardSecondTraits = standardRule.secondTraits.map((t) => t.id)

        // Check if any traits are shared between the rules
        return (
          this.doArraysIntersect(conditionalFirstTraits, standardFirstTraits) ||
          this.doArraysIntersect(conditionalFirstTraits, standardSecondTraits) ||
          this.doArraysIntersect(conditionalSecondTraits, standardFirstTraits) ||
          this.doArraysIntersect(conditionalSecondTraits, standardSecondTraits)
        )

      case "layer-to-traits":
      case "traits-to-layer":
        // Check if the same layer is involved
        if (conditionalRule.layerId !== standardRule.layerId) return false

        // Check if any traits are shared
        const conditionalTraits = conditionalRule.traits.map((t) => t.id)
        const standardTraits = standardRule.traits.map((t) => t.id)

        return this.doArraysIntersect(conditionalTraits, standardTraits)

      default:
        return false
    }
  },

  // Helper function to check if two arrays have any common elements
  doArraysIntersect: (array1, array2) => array1.some((item) => array2.includes(item)),

  // Get human-readable rule type text
  getRuleTypeText: (ruleType) => {
    switch (ruleType) {
      case "never-combine":
        return "Never Combine"
      case "always-combine":
        return "Always Combine"
      case "conditional-restriction":
        return "Conditional Restriction"
      case "always-on-top":
        return "Always on Top"
      case "always-on-bottom":
        return "Always on Bottom"
      default:
        return ruleType
    }
  },
}
