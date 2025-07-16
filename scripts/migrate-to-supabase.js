#!/usr/bin/env node

// Migration script to transfer team data from files to Supabase
// Run with: node scripts/migrate-to-supabase.js

const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateTeams() {
  console.log('🚀 Starting migration from files to Supabase...\n');

  const TEAMS_DIR = path.join(process.cwd(), 'teams');
  
  try {
    // Check if teams directory exists
    try {
      await fs.access(TEAMS_DIR);
    } catch (error) {
      console.log('📁 No teams directory found. Creating sample data in Supabase...');
      await createSampleData();
      return;
    }

    // Read teams.txt
    let teamNames = [];
    try {
      const teamsContent = await fs.readFile(path.join(TEAMS_DIR, 'teams.txt'), 'utf-8');
      teamNames = teamsContent.split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0);
    } catch (error) {
      console.log('📄 No teams.txt found. Scanning for member files...');
      
      // Scan for team member files
      const files = await fs.readdir(TEAMS_DIR);
      teamNames = files
        .filter(file => file.endsWith('-members.txt'))
        .map(file => file.replace('-members.txt', ''));
    }

    if (teamNames.length === 0) {
      console.log('❌ No teams found to migrate');
      return;
    }

    console.log(`📋 Found ${teamNames.length} teams to migrate:`, teamNames);

    // Migrate each team
    for (const teamName of teamNames) {
      await migrateTeam(teamName, TEAMS_DIR);
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Add Supabase environment variables to your production environment');
    console.log('2. Update your deployment configuration');
    console.log('3. Test the application with the new database');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

async function migrateTeam(teamName, teamsDir) {
  console.log(`\n🔄 Migrating team: ${teamName}`);

  try {
    // Create team in Supabase
    let { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({ name: teamName })
      .select()
      .single();

    if (teamError) {
      if (teamError.code === '23505') { // Unique violation
        console.log(`  ℹ️  Team '${teamName}' already exists, updating members...`);
        
        // Get existing team
        const { data: existingTeam, error: getTeamError } = await supabase
          .from('teams')
          .select('id')
          .eq('name', teamName)
          .single();
        
        if (getTeamError) throw getTeamError;
        team = existingTeam;
      } else {
        throw teamError;
      }
    } else {
      console.log(`  ✅ Created team: ${teamName}`);
    }

    // Read team members from file
    const membersFile = path.join(teamsDir, `${teamName}-members.txt`);
    let members = [];
    
    try {
      const membersContent = await fs.readFile(membersFile, 'utf-8');
      members = membersContent.split('\n')
        .map(email => email.trim().toLowerCase())
        .filter(email => email.length > 0 && email.includes('@'));
    } catch (error) {
      console.log(`  ⚠️  No members file found for ${teamName}`);
      return;
    }

    if (members.length === 0) {
      console.log(`  ℹ️  No members found for ${teamName}`);
      return;
    }

    // Delete existing members for this team
    const { error: deleteError } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', team.id);

    if (deleteError) throw deleteError;

    // Insert new members
    const memberRecords = members.map(email => ({
      team_id: team.id,
      email: email
    }));

    const { error: insertError } = await supabase
      .from('team_members')
      .insert(memberRecords);

    if (insertError) throw insertError;

    console.log(`  ✅ Migrated ${members.length} members for ${teamName}`);

  } catch (error) {
    console.error(`  ❌ Failed to migrate team ${teamName}:`, error.message);
    throw error;
  }
}

async function createSampleData() {
  console.log('📊 Creating sample teams in Supabase...');

  const sampleTeams = [
    'frontend',
    'backend', 
    'devops',
    'mobile',
    'qa',
    'management'
  ];

  for (const teamName of sampleTeams) {
    try {
      const { error } = await supabase
        .from('teams')
        .insert({ name: teamName });

      if (error && error.code !== '23505') { // Ignore if already exists
        throw error;
      }
      
      console.log(`  ✅ Created sample team: ${teamName}`);
    } catch (error) {
      console.error(`  ❌ Failed to create team ${teamName}:`, error.message);
    }
  }

  console.log('\n✅ Sample teams created! You can now add members through the UI.');
}

// Run migration
migrateTeams().catch(console.error); 