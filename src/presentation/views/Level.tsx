import { LevelForm } from '../pages/levels/Form';
import { LevelsList } from '../pages/levels/List';

export const Level = () => {
  return (
    <div>
      <h1>Levels Management</h1>
      <LevelForm />
      <LevelsList />
    </div>
  );
};