export const SECURITY_DECLARATIONS = {
  declared_data_sensitivity: 'public',
  declared_permissions: 'readonly',
  declared_external_urls: [
    'https://api.kcg.gov.tw',
    'https://data.ntpc.gov.tw',
    'https://data.tycg.gov.tw',
    'https://datacenter.hccg.gov.tw',
    'https://datacenter.taichung.gov.tw',
    'https://tcgbusfs.blob.core.windows.net',
  ],
  is_open_source: true,
} as const;
