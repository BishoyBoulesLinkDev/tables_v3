export interface Hospital {
  id: string;
  text: string;
}

export interface Institute {
  id: string;
  text: string;
  children: Hospital[];
}

export interface City {
  id: string;
  text: string;
  children: Institute[];
}

export interface Database {
  cities: City[];
}
