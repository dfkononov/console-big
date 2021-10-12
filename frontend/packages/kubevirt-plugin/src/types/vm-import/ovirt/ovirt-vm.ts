export type OvirtNIC = {
  id: string;
  netname: string;
  name: string;
  mac: string;
  interface: string;
  vnicid: string;
  vnicnetname: string;
  sriov: boolean;
};

export type OvirtDisk = {
  bootable: boolean;
  id: string;
  interface: string;
  name: string;
  size: number;
  mode: string;
  sdname: string;
  sdid: string;
};

export type OvirtVM = {
  boot: string[];
  cpu: {
    cores: number;
    cpusockets: number;
    cputhreads: number;
  };
  disks: OvirtDisk[];
  id: string;
  memory: number;
  name: string;
  description: string;
  nics: OvirtNIC[];
  os: {
    ostype: string;
    osversion: string;
    osdist: string;
  };
  vmtype: string;
};
