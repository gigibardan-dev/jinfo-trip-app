-- Create demo admin user
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data, confirmation_token, email_change, email_change_token_new, recovery_token) 
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'admin@travelpro.ro',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"nume":"Admin","prenume":"TravelPro","role":"admin"}'::jsonb,
  '',
  '',
  '',
  ''
);

-- Create demo tourist user  
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  'turist@travelpro.ro', 
  crypt('turist123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"nume":"Turist","prenume":"Demo","role":"tourist"}'::jsonb,
  '',
  '',
  '',
  ''
);

-- Manually create profiles since trigger might not fire for direct inserts
INSERT INTO public.profiles (id, email, nume, prenume, role) VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, 'admin@travelpro.ro', 'Admin', 'TravelPro', 'admin'),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'turist@travelpro.ro', 'Turist', 'Demo', 'tourist');

-- Create demo group
INSERT INTO public.tourist_groups (id, nume_grup, admin_user_id, invite_code) VALUES
  ('10000000-0000-0000-0000-000000000001'::uuid, 'Grup Demo București-Paris', '00000000-0000-0000-0000-000000000001'::uuid, 'DEMO2024');

-- Add tourist to group
INSERT INTO public.group_members (group_id, user_id, role_in_group) VALUES
  ('10000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000002'::uuid, 'member');

-- Create demo trip
INSERT INTO public.trips (id, group_id, nume, destinatie, tara, oras, start_date, end_date, status, created_by_admin_id, descriere) VALUES
  ('20000000-0000-0000-0000-000000000001'::uuid, 
   '10000000-0000-0000-0000-000000000001'::uuid,
   'Escapadă Romantică la Paris',
   'Paris, Franța',
   'Franța',
   'Paris',
   CURRENT_DATE + INTERVAL '30 days',
   CURRENT_DATE + INTERVAL '37 days',
   'confirmed',
   '00000000-0000-0000-0000-000000000001'::uuid,
   'O călătorie de neuitat prin orașul iubirii - Paris. Vizitează Turnul Eiffel, Luvru și plimbă-te pe Champs-Élysées.');

-- Create demo itinerary days
INSERT INTO public.itinerary_days (id, trip_id, day_number, date, title, overview) VALUES
  ('30000000-0000-0000-0000-000000000001'::uuid, '20000000-0000-0000-0000-000000000001'::uuid, 1, CURRENT_DATE + INTERVAL '30 days', 'Ziua 1 - Sosirea în Paris', 'Sosirea și cazarea, prima plimbare prin centrul orașului'),
  ('30000000-0000-0000-0000-000000000002'::uuid, '20000000-0000-0000-0000-000000000001'::uuid, 2, CURRENT_DATE + INTERVAL '31 days', 'Ziua 2 - Turnul Eiffel și Champs-Élysées', 'Vizita la cel mai faimos monument parizian'),
  ('30000000-0000-0000-0000-000000000003'::uuid, '20000000-0000-0000-0000-000000000001'::uuid, 3, CURRENT_DATE + INTERVAL '32 days', 'Ziua 3 - Luvru și Muzeele', 'Zi dedicată culturii și artei'),
  ('30000000-0000-0000-0000-000000000004'::uuid, '20000000-0000-0000-0000-000000000001'::uuid, 4, CURRENT_DATE + INTERVAL '33 days', 'Ziua 4 - Montmartre și Sacré-Cœur', 'Explorarea cartierului artistic'),
  ('30000000-0000-0000-0000-000000000005'::uuid, '20000000-0000-0000-0000-000000000001'::uuid, 5, CURRENT_DATE + INTERVAL '34 days', 'Ziua 5 - Versailles', 'Excursie la palatul regal'),
  ('30000000-0000-0000-0000-000000000006'::uuid, '20000000-0000-0000-0000-000000000001'::uuid, 6, CURRENT_DATE + INTERVAL '35 days', 'Ziua 6 - Shopping și Seine', 'Ultima zi de cumpărături și croazieră'),
  ('30000000-0000-0000-0000-000000000007'::uuid, '20000000-0000-0000-0000-000000000001'::uuid, 7, CURRENT_DATE + INTERVAL '36 days', 'Ziua 7 - Plecarea', 'Check-out și plecarea spre aeroport');

-- Create demo activities for Day 1
INSERT INTO public.itinerary_activities (day_id, start_time, end_time, title, description, location_name, address, latitude, longitude, activity_type, cost_estimate, tips_and_notes, display_order) VALUES
  ('30000000-0000-0000-0000-000000000001'::uuid, '10:00', '12:00', 'Sosirea la Hotel', 'Check-in la hotel și cazare', 'Hotel Le Marais', '15 Rue de Turenne, 75004 Paris', 48.8566, 2.3522, 'accommodation', 0, 'Check-in disponibil de la ora 15:00, dar puteți lăsa bagajele mai devreme', 1),
  ('30000000-0000-0000-0000-000000000001'::uuid, '14:00', '16:00', 'Plimbare prin Marais', 'Prima explorare a cartierului istoric Marais', 'Cartierul Marais', 'Place des Vosges, 75004 Paris', 48.8555, 2.3665, 'attraction', 0, 'Cartier foarte pitoresc, perfect pentru orientare', 2),
  ('30000000-0000-0000-0000-000000000001'::uuid, '19:00', '21:00', 'Cină de bun venit', 'Cină la restaurant tradițional francez', 'Le Procope', '13 Rue de l''Ancienne Comédie, 75006 Paris', 48.8529, 2.3387, 'meal', 45, 'Cel mai vechi restaurant din Paris, rezervare obligatorie', 3);

-- Create demo activities for Day 2  
INSERT INTO public.itinerary_activities (day_id, start_time, end_time, title, description, location_name, address, latitude, longitude, activity_type, cost_estimate, tips_and_notes, display_order) VALUES
  ('30000000-0000-0000-0000-000000000002'::uuid, '09:00', '11:00', 'Vizita Turnul Eiffel', 'Urcarea cu liftul la etajul 2 al Turnului Eiffel', 'Turnul Eiffel', 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris', 48.8584, 2.2945, 'attraction', 29, 'Rezervați biletele online pentru a evita cozile. Mergeți dimineața pentru lumină mai bună', 1),
  ('30000000-0000-0000-0000-000000000002'::uuid, '14:00', '17:00', 'Plimbare pe Champs-Élysées', 'Shopping și plimbare pe cea mai faimoasă avenue', 'Champs-Élysées', 'Avenue des Champs-Élysées, 75008 Paris', 48.8698, 2.3076, 'attraction', 0, 'Începeți de la Arc de Triomphe și mergeți spre Place de la Concorde', 2),
  ('30000000-0000-0000-0000-000000000002'::uuid, '17:30', '18:30', 'Vizita Arc de Triomphe', 'Admirarea monumentului și panoramei', 'Arc de Triomphe', 'Place Charles de Gaulle, 75008 Paris', 48.8738, 2.2950, 'attraction', 13, 'Priveliște superb asupra întregului Paris', 3);

-- Create demo communication
INSERT INTO public.communications (from_admin_id, trip_id, target_type, target_group_id, message_type, title, message, sent_at) VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid,
   '20000000-0000-0000-0000-000000000001'::uuid,
   'group',
   '10000000-0000-0000-0000-000000000001'::uuid,
   'info',
   'Bun venit în călătoria la Paris!',
   'Dragă echipă,

Sunteți gata pentru o experiență de neuitat la Paris? Aici găsiți informațiile importante:

📋 **Ce să aduceți:**
- Documentele de identitate (pașaport/CI)
- Adaptor pentru prize (tip E/F pentru Franța)
- Încălțăminte confortabilă pentru plimbări
- Jachetă pentru seri (poate fi răcoros)

🌟 **Highlights-urile călătoriei:**
- Turnul Eiffel cu acces la etajul 2
- Muzeul Luvru - Mona Lisa vă așteaptă!
- Croazieră romantică pe Sena
- Plimbare prin Montmartre

📱 **Aplicația TravelPro:**
Toate documentele, itinerariul și hărțile sunt disponibile offline în aplicație. Descărcați-le înainte de plecare!

Vă aștept cu nerăbdare să creăm amintiri minunate împreună!

Cu drag,
Admin TravelPro',
   now());

-- Mark communication as read by tourist
INSERT INTO public.communication_reads (communication_id, user_id) 
SELECT c.id, '00000000-0000-0000-0000-000000000002'::uuid
FROM public.communications c 
WHERE c.title = 'Bun venit în călătoria la Paris!';