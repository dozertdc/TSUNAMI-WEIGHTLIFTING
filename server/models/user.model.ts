import { pool } from '../config/db.config';

export interface User {
  id?: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
}

export const createUser = async (user: User) => {
  const query = `
    INSERT INTO users (email, password_hash, first_name, last_name)
    VALUES ($1, $2, $3, $4)
    RETURNING id, email, first_name, last_name`;
  
  const values = [user.email, user.password_hash, user.first_name, user.last_name];
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const findUserByEmail = async (email: string) => {
  const query = `
    SELECT id, email, password_hash, first_name, last_name
    FROM users
    WHERE email = $1`;
  
  const result = await pool.query(query, [email]);
  const user = result.rows[0];
  console.log('Found user in DB:', { ...user, password_hash: !!user?.password_hash }); // Debug log
  return user;
};

export interface UserBasicInfo {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export async function getAllUsers(): Promise<UserBasicInfo[]> {
  try {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name FROM users ORDER BY last_name ASC'
    );
    return result.rows;
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    throw error;
  }
} 