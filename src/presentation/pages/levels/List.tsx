import { useEffect, useState } from 'react';
import { GetLevels } from '../../../application/level/GetLevels';
import { DeleteLevel } from '../../../application/level/DeleteLevel';
import type { Level } from '../../../models/Level';

export const LevelsList = () => {
  const [levels, setLevels] = useState<Level[]>([]);

  const fetchLevels = async () => {
    const data = await GetLevels();
    setLevels(data);
  };

  const handleDelete = async (id: number) => {
    await DeleteLevel(id);
    fetchLevels();
  };

  useEffect(() => {
    fetchLevels();
  }, []);

  return (
    <div>
      <h2>Levels</h2>
      <ul>
        {levels.map((level) => (
          <li key={level.id}>
            {level.name}
            <button onClick={() => handleDelete(level.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};