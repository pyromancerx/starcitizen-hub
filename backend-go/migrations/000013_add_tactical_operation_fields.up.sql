-- Add tactical and organizational fields to operations
ALTER TABLE operations ADD COLUMN objective_list JSON;
ALTER TABLE operations ADD COLUMN comms_frequency TEXT;
ALTER TABLE operations ADD COLUMN intel_url TEXT;
ALTER TABLE operations ADD COLUMN security_level TEXT DEFAULT 'public';
ALTER TABLE operations ADD COLUMN hazards TEXT;
