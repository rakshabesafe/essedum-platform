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

package com.infosys.icets.icip.icipwebeditor.event.model;

import org.springframework.context.ApplicationEvent;
import org.springframework.web.multipart.MultipartFile;

import lombok.Getter;

// TODO: Auto-generated Javadoc
//
/**
 * The Class FileUploadEvent.
 *
 * @author icets
 */

/**
 * Gets the total count.
 *
 * @return the total count
 */

/**
 * Gets the total count.
 *
 * @return the total count
 */

/**
 * Gets the total count.
 *
 * @return the total count
 */
@Getter
public class ExpFileUploadEvent extends ApplicationEvent {

	/** The Constant serialVersionUID. */
	private static final long serialVersionUID = 1L;

	/** The file id. */
	private String fileId;
	
	/** The file path. */
	private String filePath;
	
	/** The file. */
	private MultipartFile file;
	
	/** The url. */
	private String url;
	
	/** The total count. */
	private int totalCount;

	/**
	 * Instantiates a new exp file upload event.
	 *
	 * @param source the source
	 * @param fileId the file id
	 * @param filePath the file path
	 * @param file the file
	 * @param url the url
	 * @param totalCount the total count
	 */
	public ExpFileUploadEvent(Object source, String fileId, String filePath, MultipartFile file, String url,
			int totalCount) {
		super(source);
		this.fileId = fileId;
		this.filePath = filePath;
		this.file = file;
		this.url = url;
		this.totalCount = totalCount;
	}

}
