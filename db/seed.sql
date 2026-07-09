-- SEED: datos iniciales. Ejecutar DESPUÉS de schema.sql. Idempotente NO — ejecutar una sola vez.

insert into empresas (id, nombre, ruc) values ('a6f1d8c3-6194-5804-ac16-a98cc205559d', 'Alfa Co S.A.C.', null);

insert into proyectos (id, empresa_id, nombre) values ('521c5f2b-a6fb-5add-ae44-913752a27cde', 'a6f1d8c3-6194-5804-ac16-a98cc205559d', 'CALIDDA');
insert into proyectos (id, empresa_id, nombre) values ('6f811197-a8f6-5a82-88f4-8dff77299da9', 'a6f1d8c3-6194-5804-ac16-a98cc205559d', 'CONTUGAS');
insert into proyectos (id, empresa_id, nombre) values ('5233abd8-7ec4-595a-b65c-3694e9741f19', 'a6f1d8c3-6194-5804-ac16-a98cc205559d', 'ELECTRODUNAS');
insert into proyectos (id, empresa_id, nombre) values ('44f08a60-025f-5bdd-bd31-36c795988f98', 'a6f1d8c3-6194-5804-ac16-a98cc205559d', 'TENGDA');
insert into proyectos (id, empresa_id, nombre) values ('ac5d6441-8769-529d-b6ea-832b1aed65fa', 'a6f1d8c3-6194-5804-ac16-a98cc205559d', 'GENERAL');

insert into categorias (id, empresa_id, nombre, tipo) values ('e002fb1b-5c16-59a2-9a5b-8b6c4b780b29', 'a6f1d8c3-6194-5804-ac16-a98cc205559d', 'Alquiler de Maquinaria y Equipos', 'servicio');
insert into categorias (id, empresa_id, nombre, tipo) values ('27eab39b-d505-5d1f-85ff-615de00b8e9a', 'a6f1d8c3-6194-5804-ac16-a98cc205559d', 'Bienes Generales', 'bien');
insert into categorias (id, empresa_id, nombre, tipo) values ('4fe1c8eb-2067-5121-a3d9-1f51f8059a92', 'a6f1d8c3-6194-5804-ac16-a98cc205559d', 'Equipos Poder', 'servicio');
insert into categorias (id, empresa_id, nombre, tipo) values ('58d5cd65-a153-5cb4-b6d6-5ea3c87fdd5f', 'a6f1d8c3-6194-5804-ac16-a98cc205559d', 'Maquinaria Pesada', 'servicio');
insert into categorias (id, empresa_id, nombre, tipo) values ('e49105b2-4b4c-557e-b55d-7a6d977c8a9c', 'a6f1d8c3-6194-5804-ac16-a98cc205559d', 'Movilidad para Obra', 'servicio');
insert into categorias (id, empresa_id, nombre, tipo) values ('a5c7f0fc-bfc1-5204-80e3-1f613382edd3', 'a6f1d8c3-6194-5804-ac16-a98cc205559d', 'Servicio de Seguridad', 'servicio');
insert into categorias (id, empresa_id, nombre, tipo) values ('6bf4bdda-3739-51f4-be22-48b0e38ea47a', 'a6f1d8c3-6194-5804-ac16-a98cc205559d', 'Servicios Generales', 'servicio');
insert into categorias (id, empresa_id, nombre, tipo) values ('30a409fd-4ff6-5785-938b-4e571b760011', 'a6f1d8c3-6194-5804-ac16-a98cc205559d', 'Suministro de Concreto Pre-mezclado', 'bien');
insert into categorias (id, empresa_id, nombre, tipo) values ('a18fb552-93f5-58a4-be11-ce3e5274f443', 'a6f1d8c3-6194-5804-ac16-a98cc205559d', 'Transporte Privado', 'servicio');
insert into categorias (id, empresa_id, nombre, tipo) values ('86ccc685-a2fb-562e-9ac7-debfacbcf12a', 'a6f1d8c3-6194-5804-ac16-a98cc205559d', 'Transporte de Materiales', 'servicio');

-- Niveles de aprobación (default LOG-GN-P-02; Francys validará)
insert into niveles_aprobacion (id, empresa_id, orden, nombre, monto_desde, monto_hasta) values ('46909e1d-190f-5b6e-850b-c17201df2d8a', 'a6f1d8c3-6194-5804-ac16-a98cc205559d', 1, 'Coordinación de Compras', 0, 50000);
insert into niveles_aprobacion (id, empresa_id, orden, nombre, monto_desde, monto_hasta) values ('352ff36e-8807-5378-a38d-666ac158705d', 'a6f1d8c3-6194-5804-ac16-a98cc205559d', 2, 'Dirección de Logística y T.I.', 50000, null);

insert into matrices (id, empresa_id, nombre, tipo, estado) values ('72c161f8-d731-5ee8-bb57-17e585d72fd8', 'a6f1d8c3-6194-5804-ac16-a98cc205559d', 'Selección de Proveedores (LOG-P-03 v1)', 'seleccion', 'vigente');
insert into criterios (id, matriz_id, orden, nombre, peso_max) values ('461bdba6-2302-565e-ba3a-3f823cdd02af', '72c161f8-d731-5ee8-bb57-17e585d72fd8', 1, 'Precios', 20);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('6846bcf2-fc10-5746-8245-725bca305b28', '461bdba6-2302-565e-ba3a-3f823cdd02af', 1, 'EXCELENTE', 'Menor que el promedio del mercado', 20);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('9266a081-573a-5ce1-ace3-8f280a7f6f55', '461bdba6-2302-565e-ba3a-3f823cdd02af', 2, 'BUENO', 'Igual al promedio del mercado', 15);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('5447b477-ce98-5261-ac4e-3f6bade84eae', '461bdba6-2302-565e-ba3a-3f823cdd02af', 3, 'NO CUMPLE', 'Mayor que el promedio del mercado', 0);
insert into criterios (id, matriz_id, orden, nombre, peso_max) values ('1ab3f926-0cb5-55f0-b9c6-6433cd29b445', '72c161f8-d731-5ee8-bb57-17e585d72fd8', 2, 'Atención del proveedor / Soporte técnico', 20);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('88ba2b3e-12b6-5ea9-b9dd-4377ebfc2d2e', '1ab3f926-0cb5-55f0-b9c6-6433cd29b445', 1, 'EXCELENTE', 'Atención excelente', 20);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('20aa3925-9ae5-517a-94db-3a800027105e', '1ab3f926-0cb5-55f0-b9c6-6433cd29b445', 2, 'BUENO', 'Atención buena', 15);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('85755b95-44eb-5952-83e9-91e6f7dac2c0', '1ab3f926-0cb5-55f0-b9c6-6433cd29b445', 3, 'NO CUMPLE', 'Atención mala', 0);
insert into criterios (id, matriz_id, orden, nombre, peso_max) values ('4e005f98-a597-5e19-83ac-4401f92b67d7', '72c161f8-d731-5ee8-bb57-17e585d72fd8', 3, 'Calidad certificada (ISO o similar)', 20);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('e703a231-4a03-5d3a-9a60-b5eb3fa4a0fe', '4e005f98-a597-5e19-83ac-4401f92b67d7', 1, 'EXCELENTE', 'Posee certificado', 20);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('a554e012-a9eb-52d8-8003-c3145ffca984', '4e005f98-a597-5e19-83ac-4401f92b67d7', 2, 'BUENO', 'En proceso o posee controles internos', 15);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('32de1008-7315-5540-bb96-ed52788dc6ed', '4e005f98-a597-5e19-83ac-4401f92b67d7', 3, 'NO CUMPLE', 'No posee', 0);
insert into criterios (id, matriz_id, orden, nombre, peso_max) values ('631b3cce-7019-5f46-a524-457e501ff253', '72c161f8-d731-5ee8-bb57-17e585d72fd8', 4, 'Forma de pago', 20);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('ca70b30c-1fe1-57e5-af74-30a0b1c349f7', '631b3cce-7019-5f46-a524-457e501ff253', 1, 'EXCELENTE', 'Crédito superior a 30 días o más', 20);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('7118a4c8-3efc-5b90-a4eb-ac39083578f2', '631b3cce-7019-5f46-a524-457e501ff253', 2, 'BUENO', 'Crédito a 30 días', 15);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('f07a2cab-9d2a-554c-aff5-035a346830ba', '631b3cce-7019-5f46-a524-457e501ff253', 3, 'NO CUMPLE', 'Inferior a 30 días o sin plazos', 0);
insert into criterios (id, matriz_id, orden, nombre, peso_max) values ('f8989b6d-f53d-50f7-a214-d0db524270b1', '72c161f8-d731-5ee8-bb57-17e585d72fd8', 5, 'Servicio Posventa / Garantías', 20);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('cab06caa-9c22-5c0f-93ad-cec886272b4a', 'f8989b6d-f53d-50f7-a214-d0db524270b1', 1, 'EXCELENTE', 'Otorga garantía total', 20);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('b2279d1c-8fa2-5abf-a7b4-a4300570ffb1', 'f8989b6d-f53d-50f7-a214-d0db524270b1', 2, 'BUENO', 'Otorga garantía parcial', 15);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('f9ff5853-375b-56fc-8bdc-6dd63fb2f296', 'f8989b6d-f53d-50f7-a214-d0db524270b1', 3, 'NO CUMPLE', 'No otorga garantía', 0);
insert into matriz_documentos (id, matriz_id, descripcion, eliminatorio) values ('8e000a2e-4a3b-5c83-84c3-5f4f78638cb8', '72c161f8-d731-5ee8-bb57-17e585d72fd8', '1. Fotocopia del documento del representante legal y/o persona natural', true);
insert into matriz_documentos (id, matriz_id, descripcion, eliminatorio) values ('b1d08f40-e41b-5e4f-aca7-b30438d29ce8', '72c161f8-d731-5ee8-bb57-17e585d72fd8', '2. Ficha RUC actualizado, fecha de generación menor a 30 días', true);
insert into matriz_documentos (id, matriz_id, descripcion, eliminatorio) values ('5903ae06-2f72-5af1-9ef6-eaf881bdb2a2', '72c161f8-d731-5ee8-bb57-17e585d72fd8', '3. Formato de Deuda Coactiva (SUNAT), no mayor a 30 días', true);
insert into matriz_documentos (id, matriz_id, descripcion, eliminatorio) values ('c56d5304-f0a1-5bbf-924e-1beb58aa76cb', '72c161f8-d731-5ee8-bb57-17e585d72fd8', '4. Cotización y/o propuesta económica', true);

insert into matrices (id, empresa_id, nombre, tipo, estado) values ('61ff7e7e-bcfd-50a0-9b03-a39e0d707abb', 'a6f1d8c3-6194-5804-ac16-a98cc205559d', 'Evaluación de Proveedores (LOG-P-03 v1)', 'evaluacion', 'vigente');
insert into criterios (id, matriz_id, orden, nombre, peso_max) values ('e61a4e4b-c5e3-5919-bd1b-208304227462', '61ff7e7e-bcfd-50a0-9b03-a39e0d707abb', 1, 'Precio', 15);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('451dcde7-a326-5637-bd9e-c27a846e6dd4', 'e61a4e4b-c5e3-5919-bd1b-208304227462', 1, 'EXCELENTE', 'El precio es inferior a la oferta del mercado', 15);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('f33738d9-82ca-5e5b-9688-07f369fd5f32', 'e61a4e4b-c5e3-5919-bd1b-208304227462', 2, 'BUENO', 'El precio es competitivo', 10);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('1f4f5d28-fbbf-5a8b-ab60-c5d99494a418', 'e61a4e4b-c5e3-5919-bd1b-208304227462', 3, 'NO CUMPLE', 'El precio no es competitivo', 0);
insert into criterios (id, matriz_id, orden, nombre, peso_max) values ('e1978043-47e2-503c-963c-b6fd4a8ed6f6', '61ff7e7e-bcfd-50a0-9b03-a39e0d707abb', 2, 'Cumplimiento de cantidad y entrega', 15);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('0bde59bf-d114-552d-b8d2-b17d5fe31a43', 'e1978043-47e2-503c-963c-b6fd4a8ed6f6', 1, 'EXCELENTE', 'Entrega cantidades pactadas antes de la fecha estipulada', 15);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('c16d060e-c993-5beb-9eed-e43026f9688f', 'e1978043-47e2-503c-963c-b6fd4a8ed6f6', 2, 'BUENO', 'Entrega cantidades pactadas en la fecha estipulada', 10);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('6bd49b1b-98b6-5fce-8f26-4540242e7fd2', 'e1978043-47e2-503c-963c-b6fd4a8ed6f6', 3, 'NO CUMPLE', 'No cumple cantidades o fecha', 0);
insert into criterios (id, matriz_id, orden, nombre, peso_max) values ('ab117c96-86e3-5f7f-b0b5-e89c8b8b9c20', '61ff7e7e-bcfd-50a0-9b03-a39e0d707abb', 3, 'Entrega de documentación', 15);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('494bcdb1-9599-5ae3-b078-0140b63acf82', 'ab117c96-86e3-5f7f-b0b5-e89c8b8b9c20', 1, 'EXCELENTE', 'Entrega oportuna y documentación actualizada', 15);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('63ebf431-385e-599c-b110-f171ea52489e', 'ab117c96-86e3-5f7f-b0b5-e89c8b8b9c20', 2, 'BUENO', 'Entrega/actualiza parcialmente en fecha posterior', 10);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('b304cd73-3b79-51fc-a4ed-e8360a703142', 'ab117c96-86e3-5f7f-b0b5-e89c8b8b9c20', 3, 'NO CUMPLE', 'No entrega ni actualiza documentación', 0);
insert into criterios (id, matriz_id, orden, nombre, peso_max) values ('0f6790fa-18e6-5f6b-8176-feadaf1a074f', '61ff7e7e-bcfd-50a0-9b03-a39e0d707abb', 4, 'Forma de pago', 15);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('65fa14db-4f8a-5cc7-bbe1-c943b5a4ec28', '0f6790fa-18e6-5f6b-8176-feadaf1a074f', 1, 'EXCELENTE', 'Crédito superior a 30 días o más', 15);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('9c613b7f-cbb2-5860-ae5b-f2da243bf0cc', '0f6790fa-18e6-5f6b-8176-feadaf1a074f', 2, 'BUENO', 'Crédito a 30 días', 10);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('32c7e524-cf15-5ca4-b36e-c927cc272a7b', '0f6790fa-18e6-5f6b-8176-feadaf1a074f', 3, 'REGULAR', 'Crédito a 15 días', 5);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('1ea06a8f-0af5-55a9-b281-bd8391b7dfc9', '0f6790fa-18e6-5f6b-8176-feadaf1a074f', 4, 'NO CUMPLE', 'Inferior a 15 días o sin plazos', 0);
insert into criterios (id, matriz_id, orden, nombre, peso_max) values ('33e15820-9b48-5791-9c92-3543a125729a', '61ff7e7e-bcfd-50a0-9b03-a39e0d707abb', 5, 'Servicio postventa / Garantía', 15);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('b8219507-d00f-57f0-aacb-23fda7e5f723', '33e15820-9b48-5791-9c92-3543a125729a', 1, 'EXCELENTE', 'Garantía total y control postventa', 15);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('54468595-f2db-582b-a4ba-a70489791f22', '33e15820-9b48-5791-9c92-3543a125729a', 2, 'BUENO', 'Garantía parcial, se preocupa por calidad', 10);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('7762e6ca-4c19-52a4-a416-62e09accd5e3', '33e15820-9b48-5791-9c92-3543a125729a', 3, 'NO CUMPLE', 'No otorga garantía, atiende tardíamente', 0);
insert into criterios (id, matriz_id, orden, nombre, peso_max) values ('11623b92-758a-53f2-8e37-afecb13ba547', '61ff7e7e-bcfd-50a0-9b03-a39e0d707abb', 6, 'Calidad y cumplimiento de especificaciones técnicas', 15);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('b64be712-bf94-5140-bfd5-41d0d40a72b0', '11623b92-758a-53f2-8e37-afecb13ba547', 1, 'EXCELENTE', 'Supera expectativas y mejora especificaciones', 15);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('75574fec-4de8-5229-80a9-676f34f8a156', '11623b92-758a-53f2-8e37-afecb13ba547', 2, 'BUENO', 'Cumple requisitos y especificaciones', 10);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('22457b0b-87b6-5193-ad59-f7c6c51f63cf', '11623b92-758a-53f2-8e37-afecb13ba547', 3, 'NO CUMPLE', 'Inconformidades en calidad/especificaciones', 0);
insert into criterios (id, matriz_id, orden, nombre, peso_max) values ('b068f68e-0162-5aa9-9b32-f6264e1f5a8e', '61ff7e7e-bcfd-50a0-9b03-a39e0d707abb', 7, 'Otras especificaciones', 10);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('d9ea1e66-c305-5fe9-8d02-f15938795d75', 'b068f68e-0162-5aa9-9b32-f6264e1f5a8e', 1, 'EXCELENTE', 'Logística, personal calificado y servicio según lo pactado', 10);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('7c358e2f-4208-5181-a50b-822617937b41', 'b068f68e-0162-5aa9-9b32-f6264e1f5a8e', 2, 'BUENO', 'Cumplimiento parcial', 7);
insert into criterio_opciones (id, criterio_id, orden, etiqueta, descripcion, puntos) values ('57e8120f-1ac0-528f-babe-c10e426b84fe', 'b068f68e-0162-5aa9-9b32-f6264e1f5a8e', 3, 'NO CUMPLE', 'No cumplió', 0);

insert into matrices (id, empresa_id, nombre, tipo, estado) values ('808210af-a9b1-5943-b5f5-42d906b67508', 'a6f1d8c3-6194-5804-ac16-a98cc205559d', 'Histórica — Selección (migración Excel)', 'seleccion', 'archivada');
insert into matrices (id, empresa_id, nombre, tipo, estado) values ('5779e150-82ca-52bb-8a95-0d09eb2d93b5', 'a6f1d8c3-6194-5804-ac16-a98cc205559d', 'Histórica — Evaluación (migración Excel)', 'evaluacion', 'archivada');