'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function createMockClient() {
  const conversations = [
    {id:'chat1', requester_id:'owner', interested_user_id:'interested', listing_id:'listing', created_at:'2026-11-18T11:00:00Z'},
    {id:'chat2', requester_id:'another', interested_user_id:'owner', wanted_request_id:'wanted', created_at:'2026-11-18T12:00:00Z'}
  ];
  const profiles = [
    {id:'owner', full_name:'Owner Student'},
    {id:'interested', full_name:'Priya Sharma'},
    {id:'another', full_name:'Aman Kapoor'}
  ];
  return {
    from(name) {
      if (name === 'conversations') return {
        select() {return this;},
        eq(column,value) {this.filterColumn=column;this.filterValue=value;return this;},
        async order() {return {data:conversations.filter(row => row[this.filterColumn]===this.filterValue),error:null};}
      };
      if (name === 'profiles') return {
        select() {return this;},
        async in(column,ids) {return {data:profiles.filter(row => ids.includes(row[column])),error:null};}
      };
      throw Error(`Unexpected table ${name}`);
    }
  };
}

test('participant names come from public.profiles for either conversation role', async () => {
  const context = {window:{CampusAuth:{client:createMockClient()}}, console};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/wanted-data.js'),'utf8'), context);
  const rows = await context.window.CampusWantedDB.getMyConversations({id:'owner'});
  assert.equal(rows.length, 2);
  assert.equal(rows[0].otherStudentName, 'Aman Kapoor');
  assert.equal(rows[1].otherStudentName, 'Priya Sharma');
  assert.equal(rows[0].otherStudentId, 'another');
  assert.equal(rows[1].otherStudentId, 'interested');
});

test('message UI no longer displays hardcoded Other student', () => {
  const source = fs.readFileSync(path.join(__dirname,'../js/messages.js'),'utf8');
  assert.doesNotMatch(source, /Other student/);
  assert.match(source, /getOtherStudentName\(conversation\)/);
  assert.match(source, /addMessageBubble\(message, conversation\)/);
});
