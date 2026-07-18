// ============================================================
// RENDER: MASTER
// ============================================================
function renderGame() {
  // Check ore goal every render — catches cases where trigger was missed
  checkOreGoal();
  const app=document.getElementById('app');
  let html='';
  switch (gameState.currentScreen) {
    case 'title':            html=renderTitleScreen();          break;
    case 'intro':            html=renderIntroScreen();          break;
    case 'home':             html=renderHomeScreen();           break;
    case 'veins':            html=renderVeinsScreen();          break;
    case 'inventory':       html=renderInventoryScreen();      break;
    case 'stats':           html=renderStatsScreen();          break;
    case 'save':            html=renderSaveScreen();           break;
    case 'event_home_raid_intro':   html=renderHomeRaidIntroScreen();   break;
    case 'event_home_raid_debrief': html=renderHomeRaidDebriefScreen(); break;
    case 'world':           html=renderWorldScreen();          break;
    case 'property':        html=renderPropertyScreen();       break;
    case 'factions':        html=renderFactionsScreen();       break;
    case 'barometer':       html=renderBarometerScreen();      break;
    case 'contacts':         html=renderContactsScreen();       break;
    case 'sms_archie':       html=renderSmsArchie1Screen();     break;
    case 'sms_archie_2':     html=renderSmsArchie2Screen();     break;
    case 'event_james':      html=renderJamesEventScreen();     break;
    case 'event_buyer':      html=renderBuyerEventScreen();     break;
    case 'event_archie_craft_chat':html=renderArchieCraftChatScreen();break;
    case 'event_archie_motion':  html=renderArchieMotionEventScreen(); break;
    case 'event_james_motion':   html=renderJamesMotionEventScreen();  break;
    case 'crafting':         html=renderCraftingScreen();       break;
    case 'combat':           html=renderCombatScreen();         break;
    default: html=`<p style="padding:20px">Unknown screen: ${gameState.currentScreen}</p>`;
  }
  const NO_NAV = ['title','intro','event_james','event_buyer','event_archie_craft_chat','event_archie_motion','event_james_motion','event_home_raid_intro','event_home_raid_debrief','combat'];
  const showNav = !NO_NAV.includes(gameState.currentScreen);
  const navHTML = showNav ? renderGlobalNav() : '';
  const spacer  = showNav ? '<div class="global-nav-spacer"></div>' : '';
  app.innerHTML = html + spacer + renderModal() + navHTML;
  const log=document.querySelector('.combat-log'); if(log) log.scrollTop=log.scrollHeight;
  const sms=document.getElementById('smsBody'); if(sms) sms.scrollTop=sms.scrollHeight;

}

// ============================================================
// INIT
// ============================================================
