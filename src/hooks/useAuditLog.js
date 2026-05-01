// useAuditLog.js
// Custom hook that provides a reusable logAction() function.
// Gets the current user directly from Supabase auth instead of context
// to avoid timing issues with React rendering.

import { supabase } from '../supabaseClient';

export function useAuditLog() {

  // sanitize: strips nested objects that cause JSONB errors in Supabase
  const sanitize = (data) => {
    if (!data) return null;
    const clean = {};
    for (const key in data) {
      if (typeof data[key] !== 'object' || data[key] === null) {
        clean[key] = data[key];
      }
    }
    return clean;
  };

  const logAction = async (action, tableName, oldData = null, newData = null) => {
    try {
      // Get user directly from Supabase instead of relying on context timing
      const { data: { user } } = await supabase.auth.getUser();

      console.log('logAction firing:', action, tableName, 'user:', user?.id);

      const { error } = await supabase.from('audit_logs').insert([{
        user_id: user?.id,
        action,
        table_name: tableName,
        old_data: sanitize(oldData),
        new_data: sanitize(newData),
      }]);

      if (error) console.error('Audit insert error:', error.message);

    } catch (err) {
      console.error('Audit log failed:', err.message);
    }
  };

  return { logAction };
}