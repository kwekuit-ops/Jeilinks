import prisma from "./prisma";

export async function getNetworkSettings() {
  const settings = await prisma.systemSetting.findMany({
    where: {
      key: {
        in: [
          'NETWORK_MTN_ENABLED',
          'NETWORK_AIRTELTIGO_ENABLED',
          'NETWORK_TELECEL_ENABLED',
          'NETWORK_GLO_ENABLED',
          'NETWORK_SPECIAL_OFFERS_ENABLED'
        ]
      }
    }
  });
  
  const getSetting = (k: string) => {
    const s = settings.find(s => s.key === k);
    return s ? s.value === 'true' : true; // Default to true if not set
  };

  const enabledNetworks = {
    "MTN": getSetting('NETWORK_MTN_ENABLED'),
    "AirtelTigo": getSetting('NETWORK_AIRTELTIGO_ENABLED'),
    "Telecel": getSetting('NETWORK_TELECEL_ENABLED'),
    "Glo": getSetting('NETWORK_GLO_ENABLED'),
    "Special Offers": getSetting('NETWORK_SPECIAL_OFFERS_ENABLED')
  };

  return enabledNetworks;
}

export function filterBundlesByNetwork(bundles: any[], networkSettings: Record<string, boolean>) {
  return bundles.filter(b => {
    // If it's one of the known networks, check if it's enabled
    const normalizedNetwork = Object.keys(networkSettings).find(
      key => key.toLowerCase() === b.network.toLowerCase()
    );
    if (normalizedNetwork) {
      return networkSettings[normalizedNetwork];
    }
    // If it's an unknown network, just allow it
    return true;
  });
}
