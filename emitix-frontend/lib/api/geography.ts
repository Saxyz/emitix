export interface Department {
  id: number
  name: string
}

export interface City {
  id: number
  name: string
}

const BASE = 'https://api-colombia.com/api/v1'

export const geographyApi = {
  getDepartments: (): Promise<Department[]> =>
    fetch(`${BASE}/Department`).then((r) => r.json()),

  getCities: (departmentId: number): Promise<City[]> =>
    fetch(`${BASE}/Department/${departmentId}/cities`).then((r) => r.json()),
}
