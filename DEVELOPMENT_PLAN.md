# Development Plan: Game Variants with Fixed Number Practice

## Overview
Add functionality to allow users to practice with a fixed number instead of random numbers in all game types (Addition, Subtraction, Division, Multiplication).

## Technical Changes Required

### 1. Game Configuration Interface
- Create new types in `src/types` for game configuration:
```typescript
interface GameConfig {
  mode: 'random' | 'fixed';
  fixedNumber?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}
```

### 2. Game Selection Updates
- Modify `GameSelect.tsx` to include:
  - Mode selection (Random vs Fixed Number)
  - Number input field for fixed number mode
  - Keep existing difficulty selection

### 3. Game Components Modifications
Update the following components to support fixed number mode:
- Addition.tsx
- Subtraction.tsx
- DivisionGame.tsx
- Game.tsx (multiplication)

Changes needed in each game component:
- Add mode-aware number generation logic
- Modify problem generation to use fixed number when selected
- Update scoring system to reflect fixed number practice

### 4. State Management
- Add game configuration to existing state management
- Persist user's last used configuration

### 5. UI/UX Enhancements
- Add clear visual indicators for current mode
- Include tooltips/help text for new options
- Ensure mobile-friendly input for fixed numbers

## Implementation Steps

1. **Phase 1: Core Infrastructure**
   - Create new types and interfaces
   - Implement game configuration state management
   - Update routing to handle new game modes

2. **Phase 2: Game Select Updates**
   - Add mode selection UI
   - Implement number input for fixed mode
   - Add validation for number input

3. **Phase 3: Game Logic Updates**
   - Modify each game component to support fixed numbers
   - Update problem generation logic
   - Add mode-specific scoring adjustments

4. **Phase 4: Testing & Polish**
   - Test all game variants
   - Verify mobile compatibility
   - Add necessary tooltips and help text

## Technical Considerations

- Maintain existing difficulty levels
- Ensure backward compatibility
- Keep performance optimization in mind
- Maintain consistent UI/UX across all game types

## Future Enhancements

- Statistics tracking per mode
- Achievement system for fixed number mastery
- Custom practice sets
- Progress tracking for fixed number practice
