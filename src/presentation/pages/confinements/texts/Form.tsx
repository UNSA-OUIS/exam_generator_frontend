// presentation/pages/confinements/texts/Form.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,

  Alert,
  CircularProgress,
  MenuItem,
  Grid
} from "@mui/material";

import { Card, CardContent } from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { CreateConfinementText } from "../../../../application/confinement/CreateConfinementText";
import { UpdateConfinementText } from "../../../../application/confinement/UpdateConfinementText";
import { GetConfinementTexts } from "../../../../application/confinement/GetConfinementTexts";
import { GetBlocks } from "../../../../application/block/GetBlocks";
import type { Block } from "../../../../models/Block";
import type { ConfinementText } from "../../../../models/ConfinementText";

interface Props {
  mode: 'create' | 'edit';
  textId?: number;
}

const ConfinementTextForm = ({ mode, textId }: Props) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  
  const [formData, setFormData] = useState({
    block_id: '',
    texts_to_do: '',
    questions_per_text: ''
  });

  const fetchBlocks = async () => {
    try {
      const data = await GetBlocks();
      setBlocks(data);
    } catch (err) {
      setError("Error al cargar los bloques");
    }
  };

  const fetchTextData = async (id: number) => {
    try {
      setLoading(true);
      const texts: ConfinementText[] = await GetConfinementTexts(id.toString());
      const textData = texts.find(text => text.id === textId);
      if (textData) {
        setFormData({
          block_id: textData.block_id.toString(),
          texts_to_do: textData.texts_to_do.toString(),
          questions_per_text: textData.questions_per_text.toString()
        });
      } else {
        setError("No se encontró el texto para editar");
      }
    } catch (err) {
      setError("Error al cargar los datos del texto");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaving(true);
    setError(null);

    try {
      const data = {
        confinement_id: id,
        block_id: parseInt(formData.block_id),
        texts_to_do: parseInt(formData.texts_to_do),
        questions_per_text: parseInt(formData.questions_per_text)
      };

      if (mode === 'create') {
        await CreateConfinementText(data);
      } else if (textId) {
        await UpdateConfinementText(textId, data);
      }

      navigate(`/confinements/${id}/texts`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al guardar el texto");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  useEffect(() => {
    fetchBlocks();
    
    if (mode === 'edit' && textId) {
      fetchTextData(textId);
    }
  }, [mode, textId]);

  if (loading && mode === 'edit') {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Cargando datos del texto...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          component={Link}
          to={`/confinements/${id}/texts`}
          startIcon={<ArrowBackIcon />}
          variant="outlined"
        >
          Volver
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          {mode === 'create' ? 'Agregar Texto' : 'Editar Texto'}
        </Typography>
      </Box>

      <Card>
  <CardContent>
    <form onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        
          <TextField
            select
            fullWidth
            label="Bloque"
            name="block_id"
            value={formData.block_id}
            onChange={handleChange}
            required
            disabled={mode === 'edit'}
            sx={{ width: '100%', minWidth: 100 }}
          >
            {blocks.map((block) => (
              <MenuItem key={block.id} value={block.id}>
                {block.name}
              </MenuItem>
            ))}
          </TextField>
        

          <TextField
            fullWidth
            type="number"
            label="Textos a Realizar"
            name="texts_to_do"
            value={formData.texts_to_do}
            onChange={handleChange}
            required
            inputProps={{ min: 0 }}
          />

          <TextField
            fullWidth
            type="number"
            label="Preguntas por Texto"
            name="questions_per_text"
            value={formData.questions_per_text}
            onChange={handleChange}
            required
            inputProps={{ min: 0 }}
          />

        {error && (
            <Alert severity="error">{error}</Alert>
        )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : null}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button
              component={Link}
              to={`/confinements/${id}/texts`}
              variant="outlined"
            >
              Cancelar
            </Button>
          </Box>
        </Grid>
    </form>
  </CardContent>
</Card>

    </Box>
  );
};

export default ConfinementTextForm;