-- Add reaction counters to places table if they don't exist
ALTER TABLE places 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS favourites_count INTEGER DEFAULT 0;

-- Initialize counters from existing reactions
UPDATE places
SET 
  likes_count = COALESCE((
    SELECT COUNT(*)::INTEGER
    FROM user_reactions
    WHERE user_reactions.place_id = places.id
      AND user_reactions.reaction_type = 'like'
  ), 0),
  favourites_count = COALESCE((
    SELECT COUNT(*)::INTEGER
    FROM user_reactions
    WHERE user_reactions.place_id = places.id
      AND user_reactions.reaction_type = 'love'
  ), 0);

-- Create function to update counters when reactions change
CREATE OR REPLACE FUNCTION update_place_reaction_counters()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.reaction_type = 'like' THEN
      UPDATE places 
      SET likes_count = COALESCE(likes_count, 0) + 1
      WHERE id = NEW.place_id;
    ELSIF NEW.reaction_type = 'love' THEN
      UPDATE places 
      SET favourites_count = COALESCE(favourites_count, 0) + 1
      WHERE id = NEW.place_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.reaction_type = 'like' THEN
      UPDATE places 
      SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
      WHERE id = OLD.place_id;
    ELSIF OLD.reaction_type = 'love' THEN
      UPDATE places 
      SET favourites_count = GREATEST(COALESCE(favourites_count, 0) - 1, 0)
      WHERE id = OLD.place_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace trigger
DROP TRIGGER IF EXISTS trigger_update_place_reaction_counters ON user_reactions;
CREATE TRIGGER trigger_update_place_reaction_counters
  AFTER INSERT OR DELETE ON user_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_place_reaction_counters();
