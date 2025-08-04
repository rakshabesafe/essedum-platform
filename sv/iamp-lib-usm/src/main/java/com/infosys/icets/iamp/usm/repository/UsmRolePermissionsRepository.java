/**
 * The MIT License (MIT)
 * Copyright © 2025 Infosys Limited
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”),
 * to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

package com.infosys.icets.iamp.usm.repository;



import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.infosys.icets.iamp.usm.domain.UsmRolePermissions;


// TODO: Auto-generated Javadoc
/**
 * Spring Data JPA repository for the UsmRolePermissions entity.
 */
/**
* @author icets
*/
@SuppressWarnings("unused")
@Repository
public interface UsmRolePermissionsRepository extends JpaRepository<UsmRolePermissions,Integer> {

	/**
	 * Gets the permission by role and module.
	 *
	 * @param role the role
	 * @param module the module
	 * @return the permission by role and module
	 */
	@Query("SELECT u from UsmPermissions u where u.module=:module and u.id IN (SELECT x.permission.id from UsmRolePermissions x where x.role.id=:role)")
	List<UsmRolePermissions> getPermissionByRoleAndModule(@Param("role") Integer role,@Param("module")String module);
    
	

	/**
	 * Gets the UsmRolePermissions .
	 * @param module the module
	 * @return the Page of UsmRolePermissions 
	 */
	@Query("SELECT u from UsmRolePermissions u where u.permission.module like %:module%")
	Page<UsmRolePermissions> findAllByUsmRolePermissionsModule(@Param("module")String module,Pageable page);
	
	/**
	 * Gets the UsmRolePermissions .
	 * @param module the module
	 * @param module the permission
	 * @return the Page of UsmRolePermissions 
	 */
	@Query("SELECT u from UsmRolePermissions u where u.permission.module like %:module% and u.permission.permission like %:permission%")
	Page<UsmRolePermissions> findAllUsmRolePermissionsByModuleAndPermission(@Param("module")String module,@Param("permission")String permission,Pageable page);

	/**
	 * Gets the UsmRolePermissions .
	 * @param module the module
	 * @param module the permission
	 * @param role the role name
	 * @return the Page of UsmRolePermissions 
	 */
	@Query("SELECT u from UsmRolePermissions u where u.permission.module like %:module% and u.permission.permission like %:permission% and u.role.name like %:name%")
	Page<UsmRolePermissions> findAllUsmRolePermissionsByModuleAndPermissionAndRole(@Param("module")String module,@Param("permission")String permission,@Param("name")String name,Pageable page);
	
	/**
	 * Gets the UsmRolePermissions .
	 * @param module the module
	 * @param role the role name
	 * @return the Page of UsmRolePermissions 
	 */
	@Query("SELECT u from UsmRolePermissions u where u.permission.module like %:module%")
	Page<UsmRolePermissions> findAllUsmRolePermissionsByModule(@Param("module")String module,Pageable page);

	
	/**
	 * Gets the UsmRolePermissions .
	 * @param module the permission
	 * @param role the role name
	 * @return the Page of UsmRolePermissions 
	 */
	@Query("SELECT u from UsmRolePermissions u where u.permission.permission like %:permission%")
	Page<UsmRolePermissions> findAllUsmRolePermissionsByPermission(@Param("permission")String permission,Pageable page);

}
