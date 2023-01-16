#!/usr/bin/env bb
(ns mock-server
  (:require [org.httpkit.server :as http]
            [clojure.data.xml :as xml]
            [clojure.string :as str]
            [clojure.pprint :refer [pprint]]
            [clojure.tools.logging :as log]
            [schema.core :as s])
  (:refer-clojure :exclude [rand rand-nth rand-int]))

(defonce wsdl (slurp "projectinfo.wsdl"))

(defonce random (java.util.Random.))

(defn set-seed! [seed]
  (.setSeed random seed))

(defn rand-int [max-value]
  (.nextInt random max-value))

(defn rand-nth [seq]
  (nth seq (.nextInt random (count seq))))

(defn generate-project-description [area]
  (str area ", " (rand-nth ["yleiskaava" "kehitys" "asemakaava" "investointihanke" "ylläpito"])))

(defn generate-random-name []
  {:last-name (rand-nth ["Mäkinen" "Nieminen"])
   :first-name (rand-nth ["Matti" "Liisa"])})

(defn short-name [name]
  (str/upper-case
   (str
    (apply str (take 5 (name :first-name)))
    (apply str (take 3 (name :last-name))))))

(defn generate-random-id [max-value length]
  (let [value (rand-int max-value)]
    (format (str "%0" length "d") value)))

(defn generate-random-date [start random-days]
  (if (rand-nth [true false])
    (.plusDays start (rand-int (+ random-days 1)))
    (.minusDays start (rand-int (+ random-days 1)))))

(defn generate-network
  [{:keys [activity-count] :as config}
   {:keys [wbs-id project-description project-internal-id project-creation-date company-code plant]}]
  (let [order-number (generate-random-id 99999999 12)
        creation-date (generate-random-date project-creation-date 30)
        scheduled-start (generate-random-date (.plusDays creation-date 90) (rand-int 30))
        scheduled-finish (generate-random-date (.plusDays scheduled-start 90) (rand-int 30))
        profit-center-id (generate-random-id 999999 10)
        operations-routing-number (generate-random-id 99999 10)]
    [:NETWORK
     [:item
      [:AUFNR order-number]
      [:KTEXT project-description]
      [:PSPEL wbs-id]
      [:PSPHI project-internal-id]
      [:ERNAM (short-name (generate-random-name))]
      [:ERDAT creation-date] ;; created on
      [:GSTRS scheduled-start] ;; scheduled start
      [:GLTRS scheduled-finish] ;; scheduled finish
      [:FTRMS (generate-random-date scheduled-start 30)] ;; scheduled release date
      [:GSTRP (generate-random-date scheduled-start 15)] ;; basic start date
      [:GLTRP (generate-random-date scheduled-finish 10)] ;; basic finish date
      [:GSTRI (generate-random-date scheduled-start 5)] ;; actual start date
      [:GETRI "0000-00-00"] ;; confirmed order finish date
      [:FTMRI "0000-00-00"] ;; actual release date
      [:AENAM (short-name (generate-random-name))] ;; last changed by
      [:AEDAT] ;; Change date for order master
      [:BUKRS company-code]
      [:WERKS plant]
      [:SOWRK ""] ;; location plant
      [:IDAT2 (generate-random-date scheduled-finish 10)] ;; technical completion date
      [:PRCTR profit-center-id]
      [:KDAUF ""] ;; sales order number
      [:KDPOS "00000"] ;;" Item number in sales order"
      [:VAPLZ ""] ;; "Main work center for maintenance tasks"
      [:ACTIVITY
       (map
        (fn [x]
          (let [activity-num (generate-random-id 9999 4)
                description (rand-nth ["Rakentaminen" "Kunnossapito" "Lisätyö" "Dokumentointi" "Ylläpito" "Muu"])]
            [:item
             [:AUFPL operations-routing-number]
             [:APLZL (format "%08d" (inc x))]
             [:VORNR activity-num]
             [:AUFNR order-number]
             [:LTXA1 description]
             [:PSPHI project-internal-id]
             [:PSPEL wbs-id]
             [:PRCTR profit-center-id]
             [:WERKS plant]]))
        (range activity-count))]]]))

(defn generate-wbs
  [{:keys [wbs-count] :as config}
   {:keys [project-description project-id project-internal-id project-creation-date plant] :as ctx}]
  (let [wbs-id (generate-random-id 999999 8)
        wbs-created-date (.plusDays project-creation-date (rand-int 30))
        creator (generate-random-name)
        applicant (generate-random-name)
        cost-center (generate-random-id (rand-int 999999) 8)
        technically-completed-date (.plusDays project-creation-date (rand-int (* 3 365)))]
    (map
     (fn [id]
       [:item
        [:PSPNR wbs-id]
        [:POSID (str project-id id)]
        [:POST1 (str project-description ", kohde " (inc id))]
        [:OBJNR (str "PR" (generate-random-id 999999 8))]
        [:PSPHI project-internal-id]
        [:ERNAM (short-name creator)]
        [:ERDAT wbs-created-date]
        [:AENAM (short-name (generate-random-name))]
        [:AEDAT (.plusDays wbs-created-date (rand-int 30))]
        [:VERNR (generate-random-id 999999 8)] ;; project manager id
        [:ASTNR (generate-random-id 999999 8)] ;; applicant id
        [:ASTNA (str (:last-name applicant) " " (:first-name applicant))]
        [:STUFE 2] ;; level in project hierarchy
        [:AKSTL cost-center]
        [:FKSTL cost-center]
        [:PRART "Y4"] ;; project type
        [:PSPRI "U"] ;; priority
        [:WERKS plant]
        [:TADAT (if (.isBefore technically-completed-date (java.time.LocalDate/now))
                  technically-completed-date
                  nil)]
        [:IZWEK "30"] ;; reason for investment
        [:IUMKZ "414"] ;; reason for environmental investment
        (generate-network config (assoc ctx :wbs-id wbs-id))])
     (range wbs-count))))

(defn generate-project-info [project-id {:keys [area] :as config}]
  (let [[plant _] (str/split project-id #"_")
        internal-id (generate-random-id 100000 8)
        project-creator (generate-random-name)
        project-creation-date (generate-random-date (java.time.LocalDate/of 2020 01 01) 90)
        project-updater (generate-random-name)
        project-manager (generate-random-name)
        applicant (generate-random-name)
        company-code (generate-random-id 9999 4)
        planned-start-date (generate-random-date (.plusDays project-creation-date 90) 30)
        planned-finish-date (generate-random-date (.plusDays planned-start-date (rand-int (* 3 365))) 30)
        project-description (generate-project-description area)]
    [:PROJECT_INFO
     [:PSPNR internal-id]
     [:PSPID project-id]
     [:POST1 project-description]
     [:ERNAM (short-name project-creator)]
     [:ERDAT project-creation-date]
     [:AENAM (short-name project-updater)]
     [:AEDAT (generate-random-date (.plusDays project-creation-date 90) 30)]
     [:VERNR (generate-random-id 100000 8)]
     [:VERNA (str (:last-name project-manager) " " (:first-name project-manager))]
     [:ASTNR (generate-random-id 100000 8)]
     [:ASTNA (str (:last-name applicant) " " (:first-name applicant))]
     [:VBUKR company-code]
     [:PRCTR] ;; profit center
     [:PLFAZ planned-start-date]
     [:PLSEZ planned-finish-date]
     [:WERKS plant]
     [:WBS
      (generate-wbs
       config
       {:project-id project-id
        :project-description project-description
        :project-internal-id internal-id
        :project-creation-date project-creation-date
        :company-code company-code
        :plant plant})]]))

(defn tag-name [tag]
  (some-> tag name keyword))

(defn preprocess-elem
  "Naive recursive XML to EDN conversion. Does not handle multiple same-named elements
   under the same parent and recursion could blow on large XMLs"
  [{:keys [tag content] :as elem}]
  (let [tag (tag-name tag)]
    (cond
      (and (string? elem) (not (str/blank? elem)))
      elem
      (some? tag)
      {tag (apply merge (map preprocess-elem content))})))

(s/defschema ProjectInfoSoapMessage
  {:Envelope
   {:Header s/Any
    :Body
    {:ZPS_WS_GET_PROJECT_INFO
     {:PROJECT s/Str}}}})

(defn process-request [body]
  (let [root-elem (-> body xml/parse-str preprocess-elem)
        project-id (get-in root-elem [:Envelope :Body :ZPS_WS_GET_PROJECT_INFO :PROJECT])
        [_ id] (str/split project-id #"_")
        ;; decode mock data parameters from the id part
        ;; e.g. I1112_34567
        ;; -> 3 WBS elements, 4 activities per WBS 
        [wbs-count activity-count] (take 2 id)
        wbs-count (- (int wbs-count) 48)
        activity-count (- (int activity-count) 48)]
    (s/validate ProjectInfoSoapMessage root-elem)
    (set-seed! (Integer/parseInt id))
    (let [project-id (get-in root-elem [:Envelope :Body :ZPS_WS_GET_PROJECT_INFO :PROJECT])
          area (rand-nth ["Tesoma" "Hervanta" "Lielahti" "Keskusta" "Kaleva" "Pyynikki"])]
      {:status 200
       :content-type "text/xml"
       :body
       (xml/indent-str
        (xml/sexp-as-element
         [:SOAP:Envelope
          {:xmlns:SOAP "http://schemas.xmlsoap.org/soap/envelope/"}
          [:SOAP:Body
           [:rfc:ZPS_WS_GET_PROJECT_INFO.Response
            {:xmlns:rfc "urn:sap-com:document:sap:rfc:functions"}
            [:MESSAGES]
            (generate-project-info
             project-id
             {:area area :wbs-count wbs-count :activity-count activity-count})]]]))})))

(defn handler [{:keys [query-string request-method uri body] :as req}]
  (log/debug (with-out-str (pprint req)))
  (cond
    (and (= request-method :get)
         (= uri "/projectinfo")
         (some-> query-string (str/includes? "wsdl")))
    {:status 200
     :headers {"Content-Type" "text/xml"}
     :body wsdl}

    (and (= request-method :post)
         (= uri "/projectinfo"))
    (-> body slurp process-request)))

(defn start-server [port]
  (log/info "Starting mock server on port..." port)
  (http/run-server handler {:port port})
  (log/info "Started"))

(start-server 3000)

@(promise)
