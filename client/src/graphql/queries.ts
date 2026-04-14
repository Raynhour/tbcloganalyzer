import gql from 'graphql-tag';

export const GET_CONSUMABLES = gql`
  query GetConsumables($reportCode: String!, $fightId: Int, $fightIds: [Int!]) {
    reportConsumables(reportCode: $reportCode, fightId: $fightId, fightIds: $fightIds) {
      reportTitle
      encounters {
        id
        name
        kill
        startTime
        endTime
        encounterId
      }
      players {
        playerName
        class
        spec
        consumables {
          name
          category
          icon
          spellId
          count
          uptimePercent
          encounterBreakdown {
            fightId
            encounterName
            kill
            used
            count
            uptimePercent
          }
        }
      }
    }
  }
`;

export const GET_PLAYER_FIGHT_BUFFS = gql`
  query GetPlayerFightBuffs(
    $reportCode: String!
    $fightId: Int!
    $playerName: String!
  ) {
    playerFightBuffs(
      reportCode: $reportCode
      fightId: $fightId
      playerName: $playerName
    ) {
      playerName
      auras {
        ability
        name
        source
        icon
      }
    }
  }
`;

export const CLEAR_REPORT_CACHE = gql`
  mutation ClearReportCache($reportCode: String!) {
    clearReportCache(reportCode: $reportCode)
  }
`;

export const GET_PLAYER_FIGHT_RAW_DATA = gql`
  query GetPlayerFightRawData(
    $reportCode: String!
    $fightId: Int!
    $playerName: String!
  ) {
    playerFightRawData(
      reportCode: $reportCode
      fightId: $fightId
      playerName: $playerName
    ) {
      playerName
      auras {
        guid
        name
        totalUptime
        totalUses
      }
      casts {
        abilityGameID
        total
      }
      enchants
    }
  }
`;

export const GET_PLAYER_FIGHT_CASTS = gql`
  query GetPlayerFightCasts(
    $reportCode: String!
    $fightId: Int!
    $playerName: String!
  ) {
    playerFightCasts(
      reportCode: $reportCode
      fightId: $fightId
      playerName: $playerName
    ) {
      playerName
      casts {
        ability
        total
      }
    }
  }
`;
