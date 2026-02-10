import client from './client';

function buildQuery(filters = {}, sort) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, value);
    }
  });
  if (sort) {
    params.set('sort', sort);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const Account = {
  list: (sort) => client.get(`/accounts${sort ? `?sort=${sort}` : ''}`),
  get: (id) => client.get(`/accounts/${id}`),
  create: (data) => client.post('/accounts', data),
  update: (id, data) => client.put(`/accounts/${id}`, data),
  delete: (id) => client.delete(`/accounts/${id}`),
  filter: (filters, sort) => client.get(`/accounts${buildQuery(filters, sort)}`),
};

export const Assistance = {
  list: (sort, limit) => {
    const params = new URLSearchParams();
    if (sort) params.set('sort', sort);
    if (limit) params.set('limit', limit);
    const qs = params.toString();
    return client.get(`/assistances${qs ? `?${qs}` : ''}`);
  },
  get: (id) => client.get(`/assistances/${id}`),
  create: (data) => client.post('/assistances', data),
  update: (id, data) => client.put(`/assistances/${id}`, data),
  delete: (id) => client.delete(`/assistances/${id}`),
  filter: (filters, sort) => client.get(`/assistances${buildQuery(filters, sort)}`),
};

export const FamilyMember = {
  list: (sort) => client.get(`/family-members${sort ? `?sort=${sort}` : ''}`),
  get: (id) => client.get(`/family-members/${id}`),
  create: (data) => client.post('/family-members', data),
  update: (id, data) => client.put(`/family-members/${id}`, data),
  delete: (id) => client.delete(`/family-members/${id}`),
  filter: (filters, sort) => client.get(`/family-members${buildQuery(filters, sort)}`),
};

export const Pharmacy = {
  list: (sort) => client.get(`/pharmacies${sort ? `?sort=${sort}` : ''}`),
  get: (id) => client.get(`/pharmacies/${id}`),
  create: (data) => client.post('/pharmacies', data),
  update: (id, data) => client.put(`/pharmacies/${id}`, data),
  delete: (id) => client.delete(`/pharmacies/${id}`),
  filter: (filters, sort) => client.get(`/pharmacies${buildQuery(filters, sort)}`),
};

export const SourceOfFunds = {
  list: (sort) => client.get(`/source-of-funds${sort ? `?sort=${sort}` : ''}`),
  get: (id) => client.get(`/source-of-funds/${id}`),
  create: (data) => client.post('/source-of-funds', data),
  update: (id, data) => client.put(`/source-of-funds/${id}`, data),
  delete: (id) => client.delete(`/source-of-funds/${id}`),
  filter: (filters, sort) => client.get(`/source-of-funds${buildQuery(filters, sort)}`),
};

export const User = {
  list: (sort) => client.get(`/users${sort ? `?sort=${sort}` : ''}`),
  get: (id) => client.get(`/users/${id}`),
  create: (data) => client.post('/users', data),
  update: (id, data) => client.put(`/users/${id}`, data),
  delete: (id) => client.delete(`/users/${id}`),
  invite: (data) => client.post('/users/invite', data),
};
