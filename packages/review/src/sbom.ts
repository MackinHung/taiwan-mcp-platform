/**
 * SBOM (Software Bill of Materials) Generator
 * Produces CycloneDX 1.5 JSON format
 */

export interface SbomComponent {
  type: 'library';
  name: string;
  version: string;
  purl: string;
  licenses?: { license: { id: string } }[];
}

export interface SbomDocument {
  bomFormat: 'CycloneDX';
  specVersion: '1.5';
  serialNumber: string;
  version: 1;
  metadata: {
    timestamp: string;
    component: {
      type: 'application';
      name: string;
      version: string;
    };
  };
  components: SbomComponent[];
}

/**
 * Build a Package URL (purl) for an npm package.
 * Strips version range prefixes (^, ~, >=, <=, >, <, =)
 * Encodes scoped packages: @scope/name → %40scope/name
 */
export function buildPurl(name: string, version: string): string {
  const cleanVersion = version.replace(/^[\^~>=<]+/, '');
  const encodedName = name.startsWith('@')
    ? `%40${name.slice(1)}`
    : name;
  return `pkg:npm/${encodedName}@${cleanVersion}`;
}

/**
 * Generate a CycloneDX 1.5 SBOM from dependencies.
 *
 * @param packageName - The name of the application/server
 * @param packageVersion - The version of the application/server
 * @param dependencies - Record of dependency name → version
 * @param knownLicenses - Optional Record of dependency name → license SPDX ID
 */
export function generateSbom(
  packageName: string,
  packageVersion: string,
  dependencies: Record<string, string>,
  knownLicenses?: Record<string, string>
): SbomDocument {
  const components: SbomComponent[] = Object.entries(dependencies).map(
    ([name, version]) => {
      const component: SbomComponent = {
        type: 'library',
        name,
        version: version.replace(/^[\^~>=<]+/, ''),
        purl: buildPurl(name, version),
      };

      const license = knownLicenses?.[name];
      if (license) {
        component.licenses = [{ license: { id: license } }];
      }

      return component;
    }
  );

  return {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    serialNumber: `urn:uuid:${crypto.randomUUID()}`,
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      component: {
        type: 'application',
        name: packageName,
        version: packageVersion,
      },
    },
    components,
  };
}
